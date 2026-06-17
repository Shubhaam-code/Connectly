import express from "express"
import isAuth from "../middlewares/isAuth.js"
import {
    editProfile,
    follow,
    followingList,
    getAllNotifications,
    getCurrentUser,
    getProfile,
    markAsRead,
    search,
    suggestedUsers,
    getSavedPosts,
    getUserAnalytics,
    getActiveSessions,
    revokeSession,
    createSupportTicket,
    deleteAccount
} from "../controllers/user.controllers.js"
import { upload } from "../middlewares/multer.js"

const userRouter = express.Router()

userRouter.get("/current", isAuth, getCurrentUser)
userRouter.get("/suggested", isAuth, suggestedUsers)
userRouter.get("/getProfile/:userName", isAuth, getProfile)
userRouter.get("/follow/:targetUserId", isAuth, follow)
userRouter.get("/followingList", isAuth, followingList)
userRouter.get("/search", isAuth, search)
userRouter.get("/getAllNotifications", isAuth, getAllNotifications)
userRouter.get("/saved-posts", isAuth, getSavedPosts)
userRouter.post("/markAsRead", isAuth, markAsRead)
userRouter.post("/editProfile", isAuth, upload.fields([
    { name: "profileImage", maxCount: 1 },
    { name: "coverImage", maxCount: 1 }
]), editProfile)

// New analytics, sessions, support, and account deletion routes
userRouter.get("/analytics", isAuth, getUserAnalytics)
userRouter.get("/sessions", isAuth, getActiveSessions)
userRouter.delete("/sessions/:sessionId", isAuth, revokeSession)
userRouter.post("/support", isAuth, createSupportTicket)
userRouter.delete("/delete-account", isAuth, deleteAccount)

export default userRouter