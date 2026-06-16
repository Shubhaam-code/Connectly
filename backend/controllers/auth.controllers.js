import sendMail from "../config/Mail.js"
import { genAccessToken, genRefreshToken } from "../config/token.js"
import User from "../models/user.model.js"
import Session from "../models/session.model.js"
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import redis from "../config/redis.js"

// Cache TTLs
const SESSION_TTL = 3600         // 1 hour
const USER_CACHE_TTL = 1800      // 30 min user profile

const parseUserAgent = (uaString) => {
    let deviceType = "Desktop"
    let browserName = "Chrome"
    let osName = "Windows"

    if (!uaString) return { deviceType, browserName, osName }

    const ua = uaString.toLowerCase()

    if (ua.includes("mobi") || ua.includes("android") || ua.includes("iphone")) {
        deviceType = "Mobile"
    } else if (ua.includes("tablet") || ua.includes("ipad")) {
        deviceType = "Tablet"
    }

    if (ua.includes("windows")) {
        osName = "Windows"
    } else if (ua.includes("macintosh") || ua.includes("mac os")) {
        osName = "macOS"
    } else if (ua.includes("linux")) {
        osName = "Linux"
    } else if (ua.includes("iphone") || ua.includes("ipad")) {
        osName = "iOS"
    } else if (ua.includes("android")) {
        osName = "Android"
    }

    if (ua.includes("firefox")) {
        browserName = "Firefox"
    } else if (ua.includes("opr") || ua.includes("opera")) {
        browserName = "Opera"
    } else if (ua.includes("edg") || ua.includes("edge")) {
        browserName = "Edge"
    } else if (ua.includes("chrome")) {
        browserName = "Chrome"
    } else if (ua.includes("safari")) {
        browserName = "Safari"
    }

    return { deviceType, browserName, osName }
}

export const recordSession = async (userId, refreshToken, req) => {
    try {
        const uaString = req.headers["user-agent"] || ""
        const ipAddress = req.headers["x-forwarded-for"] || req.socket.remoteAddress || "127.0.0.1"
        const { deviceType, browserName, osName } = parseUserAgent(uaString)

        await Session.create({
            user: userId,
            refreshToken,
            userAgent: uaString.substring(0, 150),
            ipAddress,
            deviceType,
            browserName,
            osName,
            lastActive: new Date()
        })
    } catch (err) {
        console.error("Failed to record session:", err)
    }
}

// ── Cookie helper ─────────────────────────────────────────────────────────────
// sameSite: "Lax" is required for local development.
// "Strict" blocks cookies when port differs (5173 → 8000), causing 401 on all routes.
// In production, use "Strict" for security.
// const cookieOptions = (maxAge) => {
//     const isProduction = process.env.NODE_ENV === "production" || process.env.RENDER === "true"
//     return {
//         httpOnly: true,
//         maxAge,
//         secure: isProduction,
//         sameSite: isProduction ? "none" : "lax",
//         path: "/"
//     }
// }


const cookieOptions = (maxAge) => ({
    httpOnly: true,
    secure: true,      // Always HTTPS
    sameSite: "none",  // Vercel ↔ Render cross-site cookies
    maxAge,
    path: "/"
})

// Helper: set auth cookies (access + refresh pair)
const setAuthCookies = (res, accessToken, refreshToken, rememberMe = false) => {
    const accessMaxAge = rememberMe
        ? 30 * 24 * 60 * 60 * 1000   // 30 days (Remember Me)
        : 15 * 60 * 1000               // 15 minutes (default)

    res.cookie("accessToken", accessToken, cookieOptions(accessMaxAge))
    res.cookie("refreshToken", refreshToken, cookieOptions(7 * 24 * 60 * 60 * 1000))
    // Legacy "token" cookie — keeps old hooks/components working without changes
    res.cookie("token", accessToken, cookieOptions(accessMaxAge))
}

// Helper: cache user session in Redis
const cacheSession = async (userId) => {
    if (redis.isStub) return
    try {
        await redis.setex(`session:${userId}`, SESSION_TTL, "1")
    } catch (e) {
        console.error("Redis session cache error:", e.message)
    }
}

// Helper: cache user profile in Redis
const cacheUserProfile = async (userId, userData) => {
    if (redis.isStub) return
    try {
        await redis.setex(`user:${userId}`, USER_CACHE_TTL, JSON.stringify(userData))
    } catch (e) {
        console.error("Redis user cache error:", e.message)
    }
}

// ── SIGN UP ────────────────────────────────────────────────────────────────────
export const signUp = async (req, res) => {
    try {
        const { name, email, password, userName } = req.body

        if (!name || !email || !password || !userName) {
            return res.status(400).json({ message: "All fields are required" })
        }
        if (password.length < 6) {
            return res.status(400).json({ message: "Password must be at least 6 characters" })
        }
        // Normalize identifiers
        const normalizedEmail = email.toLowerCase().trim()
        const normalizedUserName = userName.toLowerCase().trim()

        const [findByEmail, findByUserName] = await Promise.all([
            User.findOne({ email: normalizedEmail }),
            User.findOne({ userName: normalizedUserName })
        ])
        if (findByEmail) return res.status(400).json({ message: "Email already exists!" })
        if (findByUserName) return res.status(400).json({ message: "Username already taken!" })

        const hashedPassword = await bcrypt.hash(password, 12)
        const user = await User.create({
            name,
            userName: normalizedUserName,
            email: normalizedEmail,
            password: hashedPassword
        })

        const accessToken = genAccessToken(user._id, true)  // Remember on signup
        const refreshToken = genRefreshToken(user._id)

        setAuthCookies(res, accessToken, refreshToken, true)
        await cacheSession(user._id)
        await recordSession(user._id, refreshToken, req)

        // Return user without password
        const userObj = user.toObject()
        delete userObj.password

        await cacheUserProfile(user._id, userObj)
        return res.status(201).json({
            ...userObj,
            refreshToken
        })

    } catch (error) {
        console.error("signUp error:", error)
        return res.status(500).json({ message: `Signup error: ${error.message}` })
    }
}

// ── SIGN IN — Username OR Email + Password ─────────────────────────────────────
export const signIn = async (req, res) => {
    try {
        const { identifier, password, rememberMe = false } = req.body

        if (!identifier || !password) {
            return res.status(400).json({ message: "Username/Email and password are required" })
        }

        const normalized = identifier.toLowerCase().trim()
        const isEmail = normalized.includes("@")

        // Smart lookup: single $or query to check both fields
        // The indexed fields (userName, email) make this fast even at scale
        const user = await User.findOne(
            isEmail
                ? { email: normalized }
                : { $or: [{ userName: normalized }, { email: normalized }] }
        ).select("+password")  // explicitly select password (select:false by default)

        if (!user) {
            return res.status(400).json({
                message: isEmail ? "No account found with this email" : "No account found with this username"
            })
        }

        // Check account lockout (from brute-force attempts stored in DB)
        if (user.lockUntil && user.lockUntil > Date.now()) {
            const mins = Math.ceil((user.lockUntil - Date.now()) / 60000)
            return res.status(429).json({
                message: `Account temporarily locked. Try again in ${mins} minute(s).`
            })
        }

        const isMatch = await bcrypt.compare(password, user.password)

        if (!isMatch) {
            // Increment failed login attempts
            user.loginAttempts = (user.loginAttempts || 0) + 1

            // After 10 failed attempts: lock for 30 minutes
            if (user.loginAttempts >= 10) {
                user.lockUntil = new Date(Date.now() + 30 * 60 * 1000)
                user.loginAttempts = 0
            }
            await user.save()

            // Clear failed login cache key on IP (handled by rateLimiter)
            return res.status(400).json({ message: "Incorrect password" })
        }

        // ── Success ────────────────────────────────────────────────────────────
        // Reset failed attempts
        if (user.loginAttempts > 0 || user.lockUntil) {
            user.loginAttempts = 0
            user.lockUntil = undefined
            await user.save()
        }

        if (user.twoFactorEnabled) {
            const otp = Math.floor(1000 + Math.random() * 9000).toString()
            user.resetOtp = otp
            user.otpExpires = new Date(Date.now() + 5 * 60 * 1000)
            user.isOtpVerified = false
            await user.save()
            try {
                await sendMail(user.email, otp)
            } catch (mailErr) {
                console.error("Failed to send 2FA email:", mailErr)
            }
            return res.status(200).json({
                twoFactorRequired: true,
                email: user.email
            })
        }

        const accessToken = genAccessToken(user._id, rememberMe)
        const refreshToken = genRefreshToken(user._id)

        setAuthCookies(res, accessToken, refreshToken, rememberMe)
        await cacheSession(user._id)
        await recordSession(user._id, refreshToken, req)

        // Return user without password
        const userObj = user.toObject()
        delete userObj.password

        // Cache user profile for fast subsequent loads
        await cacheUserProfile(user._id, userObj)

        return res.status(200).json({
            ...userObj,
            refreshToken
        })

    } catch (error) {
        console.error("signIn error:", error)
        return res.status(500).json({ message: `Signin error: ${error.message}` })
    }
}

// ── SIGN OUT ───────────────────────────────────────────────────────────────────
export const signOut = async (req, res) => {
    try {
        // Delete Redis session if user is identified
        if (req.userId && !redis.isStub) {
            await redis.del(`session:${req.userId}`)
            await redis.del(`user:${req.userId}`)
        }

        const token = req.cookies.refreshToken
        if (token) {
            await Session.deleteOne({ refreshToken: token })
        }

        res.clearCookie("accessToken")
        res.clearCookie("refreshToken")
        res.clearCookie("token")  // legacy cookie

        return res.status(200).json({ message: "Signed out successfully" })
    } catch (error) {
        console.error("signOut error:", error)
        return res.status(500).json({ message: `Signout error: ${error.message}` })
    }
}

// ── REFRESH TOKENS ─────────────────────────────────────────────────────────────
export const refreshTokens = async (req, res) => {
    try {
        const token = req.cookies.refreshToken


        if (!token) {
            return res.status(401).json({ message: "No refresh token" })

        }

        let decoded
        try {
            decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET)
        } catch {
            return res.status(401).json({ message: "Refresh token expired or invalid" })
        }

        const user = await User.findById(decoded.userId)
        if (!user) {
            return res.status(401).json({ message: "User not found" })
        }

        // Rotate both tokens
        const newAccessToken = genAccessToken(user._id)
        const newRefreshToken = genRefreshToken(user._id)

        setAuthCookies(res, newAccessToken, newRefreshToken)
        await cacheSession(user._id)

        return res.status(200).json({ message: "Tokens refreshed" })

    } catch (error) {
        console.error("refreshTokens error:", error)
        return res.status(500).json({ message: `Refresh error: ${error.message}` })
    }
}

// ── SEND OTP (password reset) ──────────────────────────────────────────────────
export const sendOtp = async (req, res) => {
    try {
        const { email } = req.body
        if (!email) return res.status(400).json({ message: "Email is required" })

        const user = await User.findOne({ email: email.toLowerCase().trim() })
        if (!user) {
            return res.status(400).json({ message: "No account found with this email" })
        }

        const otp = Math.floor(1000 + Math.random() * 9000).toString()
        user.resetOtp = otp
        user.otpExpires = new Date(Date.now() + 5 * 60 * 1000)  // 5 min
        user.isOtpVerified = false

        await user.save()
        await sendMail(user.email, otp)

        return res.status(200).json({ message: "OTP sent to your email" })

    } catch (error) {
        console.error("sendOtp error:", error)
        return res.status(500).json({ message: `Send OTP error: ${error.message}` })
    }
}

// ── VERIFY OTP ─────────────────────────────────────────────────────────────────
export const verifyOtp = async (req, res) => {
    try {
        const { email, otp } = req.body
        const user = await User.findOne({ email: email?.toLowerCase().trim() })

        if (!user || user.resetOtp !== otp || user.otpExpires < Date.now()) {
            return res.status(400).json({ message: "Invalid or expired OTP" })
        }

        user.isOtpVerified = true
        user.resetOtp = undefined
        user.otpExpires = undefined
        await user.save()

        return res.status(200).json({ message: "OTP verified" })
    } catch (error) {
        console.error("verifyOtp error:", error)
        return res.status(500).json({ message: `Verify OTP error: ${error.message}` })
    }
}

// ── RESET PASSWORD ─────────────────────────────────────────────────────────────
export const resetPassword = async (req, res) => {
    try {
        // Support both `password` (old frontend) and `newPassword` (new frontend)
        const { email, password, newPassword } = req.body
        const newPass = newPassword || password

        if (!email || !newPass) {
            return res.status(400).json({ message: "Email and new password are required" })
        }
        if (newPass.length < 6) {
            return res.status(400).json({ message: "Password must be at least 6 characters" })
        }

        const user = await User.findOne({ email: email.toLowerCase().trim() })
        if (!user || !user.isOtpVerified) {
            return res.status(400).json({ message: "OTP verification required first" })
        }

        const hashedPassword = await bcrypt.hash(newPass, 12)
        user.password = hashedPassword
        user.isOtpVerified = false
        await user.save()

        // Invalidate any active sessions for security
        if (!redis.isStub) {
            await redis.del(`session:${user._id}`)
            await redis.del(`user:${user._id}`)
        }

        return res.status(200).json({ message: "Password reset successfully" })

    } catch (error) {
        console.error("resetPassword error:", error)
        return res.status(500).json({ message: `Reset password error: ${error.message}` })
    }
}

export const switchAccount = async (req, res) => {
    try {
        const { refreshToken } = req.body
        if (!refreshToken) {
            return res.status(400).json({ message: "Refresh token is required" })
        }

        let decoded
        try {
            decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET)
        } catch (err) {
            return res.status(401).json({ message: "Session expired, please login again" })
        }

        const user = await User.findById(decoded.userId)
        if (!user) {
            return res.status(404).json({ message: "User not found" })
        }

        // Rotate access and refresh tokens
        const newAccessToken = genAccessToken(user._id)
        const newRefreshToken = genRefreshToken(user._id)

        // Revoke the old session, record the new one
        await Session.deleteOne({ refreshToken })
        await recordSession(user._id, newRefreshToken, req)

        setAuthCookies(res, newAccessToken, newRefreshToken)
        await cacheSession(user._id)

        const userObj = user.toObject()
        delete userObj.password

        // Cache user profile
        await cacheUserProfile(user._id, userObj)

        return res.status(200).json({
            ...userObj,
            refreshToken: newRefreshToken
        })
    } catch (error) {
        console.error("switchAccount error:", error)
        return res.status(500).json({ message: `Switch account error: ${error.message}` })
    }
}

export const verify2fa = async (req, res) => {
    try {
        const { email, otp } = req.body
        if (!email || !otp) {
            return res.status(400).json({ message: "Email and OTP code are required" })
        }

        const user = await User.findOne({ email: email.toLowerCase().trim() })
        if (!user || user.resetOtp !== otp || user.otpExpires < Date.now()) {
            return res.status(400).json({ message: "Invalid or expired OTP code" })
        }

        // OTP is correct! Clear it
        user.resetOtp = undefined
        user.otpExpires = undefined
        await user.save()

        // Generate tokens
        const accessToken = genAccessToken(user._id, false)
        const refreshToken = genRefreshToken(user._id)

        setAuthCookies(res, accessToken, refreshToken, false)
        await cacheSession(user._id)
        await recordSession(user._id, refreshToken, req)

        const userObj = user.toObject()
        delete userObj.password

        await cacheUserProfile(user._id, userObj)

        return res.status(200).json({
            ...userObj,
            refreshToken
        })
    } catch (error) {
        console.error("verify2fa error:", error)
        return res.status(500).json({ message: `2FA verification error: ${error.message}` })
    }
}
