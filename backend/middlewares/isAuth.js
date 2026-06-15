import jwt from "jsonwebtoken"
import redis from "../config/redis.js"
import User from "../models/user.model.js"
import { genAccessToken, genRefreshToken } from "../config/token.js"

const SESSION_TTL = 3600  // 1 hour

// ── Cookie helper ─────────────────────────────────────────────────────────────
// sameSite: "Lax" is REQUIRED for local dev (localhost:5173 → localhost:8000)
// "Strict" blocks cross-site requests; even though both are localhost, the ports
// differ so browsers treat them as different origins for cookie sending.
const cookieOptions = (maxAge) => ({
    httpOnly: true,
    maxAge,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "Strict" : "Lax"
})

// ── isAuth Middleware ─────────────────────────────────────────────────────────
const isAuth = async (req, res, next) => {
    try {
        // ── 1. Read all possible token cookies ────────────────────────────────
        const accessToken = req.cookies.accessToken || req.cookies.token

        if (accessToken) {
            let decoded = null
            let tokenErr = null

            // Try new secret first, then legacy secret (backward compat)
            try {
                decoded = jwt.verify(accessToken, process.env.JWT_ACCESS_SECRET)
            } catch (e1) {
                try {
                    decoded = jwt.verify(accessToken, process.env.JWT_SECRET)
                } catch (e2) {
                    // Store the error — if both fail, check why
                    tokenErr = e1.name === "TokenExpiredError" ? e1 : e2
                }
            }

            if (decoded) {
                req.userId = decoded.userId

                // ── 2. Touch Redis session (optional, fail-open) ──────────────
                if (!redis.isStub) {
                    try {
                        const cached = await redis.get(`session:${decoded.userId}`)
                        if (cached) {
                            await redis.expire(`session:${decoded.userId}`, SESSION_TTL)
                        } else {
                            await redis.setex(`session:${decoded.userId}`, SESSION_TTL, "1")
                        }
                    } catch (redisErr) {
                        // Redis failure must NEVER block auth — just log and continue
                        console.error("isAuth Redis error (non-fatal):", redisErr.message)
                    }
                }

                return next()
            }

            // Access token found but invalid/expired — fall through to refresh only
            // if the error was expiry; any other error (tampered token) → reject
            if (tokenErr && tokenErr.name !== "TokenExpiredError") {
                return res.status(401).json({ message: "Invalid token. Please log in again." })
            }
            // TokenExpiredError falls through to refresh token check below
        }

        // ── 3. No valid access token — try refresh token ──────────────────────
        const refreshToken = req.cookies.refreshToken

        if (!refreshToken) {
            return res.status(401).json({ message: "Authentication required" })
        }

        let refreshDecoded
        try {
            refreshDecoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET)
        } catch {
            return res.status(401).json({ message: "Session expired. Please log in again." })
        }

        // Validate user still exists
        const user = await User.findById(refreshDecoded.userId)
        if (!user) {
            return res.status(401).json({ message: "User not found" })
        }

        // ── 4. Rotate tokens silently ─────────────────────────────────────────
        const newAccessToken = genAccessToken(user._id)
        const newRefreshToken = genRefreshToken(user._id)

        res.cookie("accessToken", newAccessToken, cookieOptions(15 * 60 * 1000))
        res.cookie("token", newAccessToken, cookieOptions(15 * 60 * 1000))  // legacy compat
        res.cookie("refreshToken", newRefreshToken, cookieOptions(7 * 24 * 60 * 60 * 1000))

        // Update Redis session
        if (!redis.isStub) {
            try {
                await redis.setex(`session:${user._id}`, SESSION_TTL, "1")
            } catch (e) {
                console.error("isAuth Redis setex error (non-fatal):", e.message)
            }
        }

        req.userId = user._id
        return next()

    } catch (error) {
        console.error("isAuth error:", error)
        return res.status(500).json({ message: `Auth middleware error: ${error.message}` })
    }
}

export default isAuth