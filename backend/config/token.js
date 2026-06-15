import jwt from "jsonwebtoken"

// Access token — short-lived for API auth
// Remember Me = 30 days, otherwise 15 minutes
export const genAccessToken = (userId, rememberMe = false) => {
    const expiresIn = rememberMe ? "30d" : "15m"
    return jwt.sign({ userId, type: "access" }, process.env.JWT_ACCESS_SECRET, { expiresIn })
}

// Refresh token — long-lived for silent token rotation
// Always 7 days — stored in httpOnly cookie
export const genRefreshToken = (userId) => {
    return jwt.sign({ userId, type: "refresh" }, process.env.JWT_REFRESH_SECRET, { expiresIn: "7d" })
}

// Legacy token — kept for backward compatibility with old sessions
// Used as fallback in isAuth.js
const genToken = async (userId) => {
    try {
        const token = jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: "10y" })
        return token
    } catch (error) {
        console.error("genToken error:", error)
        throw error
    }
}

export default genToken