import express from "express"
import {
    resetPassword,
    sendOtp,
    signIn,
    signOut,
    signUp,
    verifyOtp,
    refreshTokens,
    switchAccount,
    verify2fa
} from "../controllers/auth.controllers.js"
import rateLimiter from "../middlewares/rateLimiter.js"
import isAuth from "../middlewares/isAuth.js"

const authRouter = express.Router()

authRouter.post("/verify-2fa", verify2fa)

authRouter.post("/signup", signUp)

// Rate limiter on signin — 5 attempts per IP per 15 min
authRouter.post("/signin", rateLimiter, signIn)

authRouter.post("/switch-account", switchAccount)

// Refresh token rotation — called by frontend on 401
authRouter.post("/refresh-token", refreshTokens)

// Sign out — requires auth to get userId for Redis cleanup
authRouter.get("/signout", isAuth, signOut)

// OTP password reset — original route names (backward compat)
authRouter.post("/sendOtp", sendOtp)
authRouter.post("/verifyOtp", verifyOtp)
authRouter.post("/resetPassword", resetPassword)

// Alias routes matching new ForgotPassword.jsx frontend calls
authRouter.post("/forgot-password", sendOtp)
authRouter.post("/reset-password", resetPassword)

export default authRouter