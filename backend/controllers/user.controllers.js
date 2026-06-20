import uploadOnCloudinary from "../config/cloudinary.js"
import Notification from "../models/notification.model.js"
import User from "../models/user.model.js"
import Post from "../models/post.model.js"
import Loop from "../models/loop.model.js"
import Tracking from "../models/tracking.model.js"
import Session from "../models/session.model.js"
import SupportTicket from "../models/support.model.js"
import { getSocketId, io, userSocketMap, emitToUser } from "../socket.js"
import redis from "../config/redis.js"

export const getCurrentUser = async (req, res) => {
    try {
        const userId = req.userId
        const user = await User.findById(userId)
            .populate("posts loops story following followers blockedUsers mutedUsers")
        if (!user) {
            return res.status(400).json({ message: "user not found" })
        }

        // Calculate activity stats
        const postsCount = await Post.countDocuments({ author: userId })
        const loopsCount = await Loop.countDocuments({ author: userId })
        const bookmarksCount = user.saved?.length || 0

        const likedPostsCount = await Post.countDocuments({ likes: userId })
        const likedLoopsCount = await Loop.countDocuments({ likes: userId })

        const postsWithComments = await Post.find({ "comments.author": userId })
        let commentsCount = 0
        postsWithComments.forEach(p => {
            p.comments.forEach(c => {
                if (c.author?.toString() === userId.toString()) {
                    commentsCount++
                }
                if (c.replies) {
                    c.replies.forEach(r => {
                        if (r.author?.toString() === userId.toString()) {
                            commentsCount++
                        }
                    })
                }
            })
        })

        const loopsWithComments = await Loop.find({ "comments.author": userId })
        loopsWithComments.forEach(l => {
            l.comments.forEach(c => {
                if (c.author?.toString() === userId.toString()) {
                    commentsCount++
                }
            })
        })

        const userObj = user.toObject()
        userObj.activityStats = {
            postsCount: postsCount + loopsCount,
            commentsCount,
            likesCount: likedPostsCount + likedLoopsCount,
            bookmarksCount
        }

        return res.status(200).json(userObj)
    } catch (error) {
        console.error("getCurrentUser error:", error)
        return res.status(500).json({ message: `get current user error ${error.message}` })
    }
}

export const suggestedUsers = async (req, res) => {
    try {
        const currentUser = await User.findById(req.userId)
        if (!currentUser) {
            return res.status(404).json({ message: "User not found" })
        }
        const followingIds = currentUser.following.map(id => id.toString())

        // Find all other users who are not current user and not already followed
        const candidates = await User.find({
            _id: { $nin: [req.userId, ...currentUser.following] }
        }).populate("story")

        const scoredUsers = candidates.map(user => {
            let score = 0
            
            // 1. Mutual followers count
            const candidateFollowers = user.followers.map(id => id.toString())
            const mutuals = followingIds.filter(id => candidateFollowers.includes(id))
            const mutualCount = mutuals.length
            score += mutualCount * 3

            // 2. Common interests / Profession (must match non-empty values)
            if (currentUser.profession && user.profession && 
                currentUser.profession.trim().toLowerCase() === user.profession.trim().toLowerCase() &&
                currentUser.profession.trim() !== "") {
                score += 2
            }

            // 3. Active state (online or active story)
            const isOnline = !!userSocketMap[user._id.toString()]
            if (isOnline) {
                score += 3
            }
            if (user.story) {
                score += 2
            }

            return {
                user,
                score,
                mutualCount
            }
        })

        // Sort by score descending
        scoredUsers.sort((a, b) => b.score - a.score)

        // Return top 15 candidates
        const result = scoredUsers.slice(0, 15).map(item => {
            const userObj = item.user.toObject()
            delete userObj.password
            return {
                ...userObj,
                mutualCount: item.mutualCount,
                score: item.score
            }
        })

        return res.status(200).json(result)
    } catch (error) {
        console.error("suggestedUsers error:", error)
        return res.status(500).json({ message: `get suggested user error ${error.message}` })
    }
}

export const editProfile = async (req, res) => {
    try {
        const {
            name, userName, bio, profession, gender,
            email, phone, twoFactorEnabled, profileVisibility, postVisibility, storyVisibility,
            messagePermissions, pushNotifications, emailNotifications, messageNotifications,
            blockedUsers, mutedUsers, blockUserId, unblockUserId, muteUserId, unmuteUserId
        } = req.body
        const user = await User.findById(req.userId).select("-password")
        if (!user) {
            return res.status(400).json({ message: "user not found" })
        }

        // FIX: Only check userName conflict if userName is actually changing
        if (userName && userName !== user.userName) {
            const sameUserWithUserName = await User.findOne({ userName }).select("-password")
            if (sameUserWithUserName && sameUserWithUserName._id.toString() !== req.userId.toString()) {
                return res.status(400).json({ message: "userName already exist" })
            }
        }

        // Check email conflict if email is changing
        if (email && email.toLowerCase().trim() !== user.email) {
            const normalizedEmail = email.toLowerCase().trim()
            const sameUserWithEmail = await User.findOne({ email: normalizedEmail }).select("-password")
            if (sameUserWithEmail && sameUserWithEmail._id.toString() !== req.userId.toString()) {
                return res.status(400).json({ message: "email already exist" })
            }
            user.email = normalizedEmail
        }

        // Check if removing profile image
        if (req.body.removeProfileImage === "true" || req.body.removeProfileImage === true || req.body.profileImage === "") {
            user.profileImage = ""
        } else if (req.files && req.files["profileImage"] && req.files["profileImage"][0]) {
            const profileImage = await uploadOnCloudinary(req.files["profileImage"][0].path)
            if (profileImage) {
                user.profileImage = profileImage
            }
        } else if (req.file) {
            const profileImage = await uploadOnCloudinary(req.file.path)
            if (profileImage) {
                user.profileImage = profileImage
            }
        }

        // Check if removing cover image
        if (req.body.removeCoverImage === "true" || req.body.removeCoverImage === true || req.body.coverImage === "") {
            user.coverImage = ""
        } else if (req.files && req.files["coverImage"] && req.files["coverImage"][0]) {
            const coverImage = await uploadOnCloudinary(req.files["coverImage"][0].path)
            if (coverImage) {
                user.coverImage = coverImage
            }
        }

        // Secure Password Change support
        if (req.body.newPassword && req.body.currentPassword) {
            const bcrypt = (await import("bcryptjs")).default
            const userWithPass = await User.findById(req.userId).select("+password")
            const isMatch = await bcrypt.compare(req.body.currentPassword, userWithPass.password)
            if (!isMatch) {
                return res.status(400).json({ message: "Incorrect current password" })
            }
            const salt = await bcrypt.genSalt(10)
            user.password = await bcrypt.hash(req.body.newPassword, salt)
        }

        // FIX: Only update fields that are provided (don't overwrite with undefined)
        if (name !== undefined) user.name = name
        if (userName !== undefined) user.userName = userName
        if (bio !== undefined) user.bio = bio
        if (profession !== undefined) user.profession = profession
        if (gender !== undefined) user.gender = gender

        // New preference fields
        if (phone !== undefined) user.phone = phone
        if (twoFactorEnabled !== undefined) user.twoFactorEnabled = twoFactorEnabled
        if (profileVisibility !== undefined) user.profileVisibility = profileVisibility
        if (postVisibility !== undefined) user.postVisibility = postVisibility
        if (storyVisibility !== undefined) user.storyVisibility = storyVisibility
        if (messagePermissions !== undefined) user.messagePermissions = messagePermissions
        if (pushNotifications !== undefined) user.pushNotifications = pushNotifications
        if (emailNotifications !== undefined) user.emailNotifications = emailNotifications
        if (messageNotifications !== undefined) user.messageNotifications = messageNotifications

        if (blockedUsers !== undefined) user.blockedUsers = blockedUsers
        if (mutedUsers !== undefined) user.mutedUsers = mutedUsers

        // Inline block/unblock, mute/unmute helpers
        if (blockUserId) {
            if (!user.blockedUsers.includes(blockUserId)) {
                user.blockedUsers.push(blockUserId)
            }
        }
        if (unblockUserId) {
            user.blockedUsers = user.blockedUsers.filter(id => id.toString() !== unblockUserId.toString())
        }
        if (muteUserId) {
            if (!user.mutedUsers.includes(muteUserId)) {
                user.mutedUsers.push(muteUserId)
            }
        }
        if (unmuteUserId) {
            user.mutedUsers = user.mutedUsers.filter(id => id.toString() !== unmuteUserId.toString())
        }

        await user.save()

        // Real-time event: broadcast profile updates so UI can refresh other views
        io.emit("profileUpdated", user)

        return res.status(200).json(user)

    } catch (error) {
        console.error("editProfile error:", error)
        return res.status(500).json({ message: `edit profile error ${error.message}` })
    }
}

export const getProfile = async (req, res) => {
    try {
        const userName = req.params.userName
        const user = await User.findOne({ userName })
            .select("-password")
            .populate("posts loops followers following story")
        if (!user) {
            return res.status(404).json({ message: "user not found" })
        }

        // Track profile visit if visitor is not the owner
        if (req.userId && req.userId.toString() !== user._id.toString()) {
            await Tracking.create({
                owner: user._id,
                eventType: "profile_visit",
                visitor: req.userId
            })
        }

        return res.status(200).json(user)
    } catch (error) {
        console.error("getProfile error:", error)
        return res.status(500).json({ message: `get profile error ${error.message}` })
    }
}

export const follow = async (req, res) => {
    try {
        const currentUserId = req.userId
        const targetUserId = req.params.targetUserId

        if (!targetUserId) {
            return res.status(400).json({ message: "target user is not found" })
        }

        if (currentUserId.toString() === targetUserId.toString()) {
            return res.status(400).json({ message: "you can not follow yourself." })
        }

        const currentUser = await User.findById(currentUserId)
        const targetUser = await User.findById(targetUserId)

        if (!currentUser || !targetUser) {
            return res.status(404).json({ message: "User not found" })
        }

        const isFollowing = currentUser.following.some(id => id.toString() === targetUserId.toString())

        if (isFollowing) {
            // Unfollow - pull to avoid duplicates safely
            currentUser.following = currentUser.following.filter(id => id.toString() !== targetUserId.toString())
            targetUser.followers = targetUser.followers.filter(id => id.toString() !== currentUserId.toString())
            
            await Promise.all([currentUser.save(), targetUser.save()])

            io.emit("followUpdated", {
                userId: currentUserId,
                targetUserId,
                following: currentUser.following,
                isFollowing: false,
                user: {
                    _id: currentUser._id,
                    userName: currentUser.userName,
                    name: currentUser.name,
                    profileImage: currentUser.profileImage
                },
                targetUser: {
                    _id: targetUser._id,
                    userName: targetUser.userName,
                    name: targetUser.name,
                    profileImage: targetUser.profileImage
                }
            })

            return res.status(200).json({
                following: false,
                message: "unfollow successfully"
            })
        } else {
            // Follow - prevent duplicate pushes
            if (!currentUser.following.some(id => id.toString() === targetUserId.toString())) {
                currentUser.following.push(targetUserId)
            }
            if (!targetUser.followers.some(id => id.toString() === currentUserId.toString())) {
                targetUser.followers.push(currentUserId)
            }

            // Record follow tracking event for social analytics
            await Tracking.create({
                owner: targetUserId,
                eventType: "follow",
                visitor: currentUserId
            })

            const isFollowBack = currentUser.followers.some(id => id.toString() === targetUserId.toString())
            const notiType = isFollowBack ? "follow_accepted" : "follow"
            const notiMessage = isFollowBack ? "accepted your follow request" : "started following you"

            const notification = await Notification.create({
                sender: currentUser._id,
                receiver: targetUser._id,
                type: notiType,
                message: notiMessage
            })
            const populatedNotification = await Notification.findById(notification._id).populate("sender receiver")
            emitToUser(targetUser._id, "newNotification", populatedNotification)

            await Promise.all([currentUser.save(), targetUser.save()])

            io.emit("followUpdated", {
                userId: currentUserId,
                targetUserId,
                following: currentUser.following,
                isFollowing: true,
                user: {
                    _id: currentUser._id,
                    userName: currentUser.userName,
                    name: currentUser.name,
                    profileImage: currentUser.profileImage
                },
                targetUser: {
                    _id: targetUser._id,
                    userName: targetUser.userName,
                    name: targetUser.name,
                    profileImage: targetUser.profileImage
                }
            })

            return res.status(200).json({
                following: true,
                message: "follow successfully"
            })
        }

    } catch (error) {
        console.error("follow error:", error)
        return res.status(500).json({ message: `follow error ${error.message}` })
    }
}

export const followingList = async (req, res) => {
    try {
        const result = await User.findById(req.userId)
        if (!result) {
            return res.status(404).json({ message: "user not found" })
        }
        // FIX: Return array of following IDs as strings (consistent for Redux)
        return res.status(200).json(result.following.map(id => id.toString()))
    } catch (error) {
        console.error("followingList error:", error)
        return res.status(500).json({ message: `following error ${error.message}` })
    }
}

export const search = async (req, res) => {
    try {
        const keyWord = req.query.keyWord

        if (!keyWord) {
            return res.status(400).json({ message: "keyword is required" })
        }

        const users = await User.find({
            $or: [
                { userName: { $regex: keyWord, $options: "i" } },
                { name: { $regex: keyWord, $options: "i" } }
            ]
        }).select("-password")

        return res.status(200).json(users)

    } catch (error) {
        console.error("search error:", error)
        return res.status(500).json({ message: `search error ${error.message}` })
    }
}

export const getAllNotifications = async (req, res) => {
    try {
        const notifications = await Notification.find({
            receiver: req.userId
        }).populate("sender receiver post loop").sort({ createdAt: -1 })
        return res.status(200).json(notifications)
    } catch (error) {
        console.error("getAllNotifications error:", error)
        return res.status(500).json({ message: `get notification error ${error.message}` })
    }
}

export const markAsRead = async (req, res) => {
    try {
        const { notificationId } = req.body

        if (Array.isArray(notificationId)) {
            // bulk mark-as-read
            await Notification.updateMany(
                { _id: { $in: notificationId }, receiver: req.userId },
                { $set: { isRead: true } }
            )
        } else {
            // mark single notification as read
            await Notification.findOneAndUpdate(
                { _id: notificationId, receiver: req.userId },
                { $set: { isRead: true } }
            )
        }
        return res.status(200).json({ message: "marked as read" })

    } catch (error) {
        console.error("markAsRead error:", error)
        return res.status(500).json({ message: `read notification error ${error.message}` })
    }
}

export const getSavedPosts = async (req, res) => {
    try {
        const userId = req.userId
        const user = await User.findById(userId)
            .populate({
                path: "saved",
                populate: [
                    { path: "author", select: "name userName profileImage" },
                    { path: "comments.author", select: "name userName profileImage" },
                    { path: "comments.replies.author", select: "name userName profileImage" }
                ]
            })
        if (!user) {
            return res.status(404).json({ message: "user not found" })
        }
        // Filter out null posts in case a saved post was deleted
        const savedPosts = user.saved.filter(post => post !== null)
        return res.status(200).json(savedPosts)
    } catch (error) {
        console.error("getSavedPosts error:", error)
        return res.status(500).json({ message: `get saved posts error ${error.message}` })
    }
}

export const getUserAnalytics = async (req, res) => {
    try {
        const userId = req.userId
        const { period = "7days" } = req.query

        let startDate = new Date()
        if (period === "today") {
            startDate.setHours(0, 0, 0, 0)
        } else if (period === "30days") {
            startDate.setDate(startDate.getDate() - 30)
        } else {
            startDate.setDate(startDate.getDate() - 7)
        }

        const records = await Tracking.find({
            owner: userId,
            createdAt: { $gte: startDate }
        })

        let profileViews = 0
        let impressions = 0
        let likes = 0
        let comments = 0
        let shares = 0
        const uniqueVisitors = new Set()

        records.forEach(r => {
            if (r.visitor) {
                uniqueVisitors.add(r.visitor.toString())
            }
            if (r.eventType === "profile_visit") profileViews++
            else if (r.eventType === "post_impression") impressions++
            else if (r.eventType === "post_like") likes++
            else if (r.eventType === "post_comment") comments++
            else if (r.eventType === "post_share") shares++
        })

        const posts = await Post.find({ author: userId })
        const postIds = posts.map(p => p._id)
        const saves = await User.countDocuments({
            saved: { $in: postIds }
        })

        return res.status(200).json({
            profileViews,
            impressions,
            reach: uniqueVisitors.size,
            likes,
            comments,
            shares,
            saves
        })
    } catch (error) {
        console.error("getUserAnalytics error:", error)
        return res.status(500).json({ message: `Analytics loading error: ${error.message}` })
    }
}

export const getActiveSessions = async (req, res) => {
    try {
        const userId = req.userId
        const sessions = await Session.find({ user: userId }).sort({ lastActive: -1 })
        return res.status(200).json(sessions)
    } catch (error) {
        console.error("getActiveSessions error:", error)
        return res.status(500).json({ message: `Sessions loading error: ${error.message}` })
    }
}

export const revokeSession = async (req, res) => {
    try {
        const userId = req.userId
        const sessionId = req.params.sessionId

        const session = await Session.findOne({ _id: sessionId, user: userId })
        if (!session) {
            return res.status(404).json({ message: "Session not found or unauthorized" })
        }

        await Session.findByIdAndDelete(sessionId)
        return res.status(200).json({ message: "Session revoked successfully" })
    } catch (error) {
        console.error("revokeSession error:", error)
        return res.status(500).json({ message: `Session revocation error: ${error.message}` })
    }
}

export const createSupportTicket = async (req, res) => {
    try {
        const userId = req.userId
        const { email, category, message } = req.body

        if (!email || !category || !message) {
            return res.status(400).json({ message: "All fields are required" })
        }

        const ticket = await SupportTicket.create({
            user: userId,
            email,
            category,
            message
        })

        return res.status(201).json({ message: "Support ticket submitted successfully", ticket })
    } catch (error) {
        console.error("createSupportTicket error:", error)
        return res.status(500).json({ message: `Support submission error: ${error.message}` })
    }
}

export const deleteAccount = async (req, res) => {
    try {
        const userId = req.userId

        const user = await User.findById(userId)
        if (!user) {
            return res.status(404).json({ message: "User not found" })
        }

        // Delete associated posts & loops
        await Post.deleteMany({ author: userId })
        await Loop.deleteMany({ author: userId })

        // Delete associated user data models
        await Session.deleteMany({ user: userId })
        await Tracking.deleteMany({ owner: userId })
        await SupportTicket.deleteMany({ user: userId })

        // Remove from followers / following lists of other users
        await User.updateMany(
            { followers: userId },
            { $pull: { followers: userId } }
        )
        await User.updateMany(
            { following: userId },
            { $pull: { following: userId } }
        )

        // Delete user
        await User.findByIdAndDelete(userId)

        // Clear cookies
        res.clearCookie("accessToken")
        res.clearCookie("refreshToken")
        res.clearCookie("token")

        return res.status(200).json({ message: "Account deleted successfully" })
    } catch (error) {
        console.error("deleteAccount error:", error)
        return res.status(500).json({ message: `Account deletion error: ${error.message}` })
    }
}