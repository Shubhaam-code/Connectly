import uploadOnCloudinary from "../config/cloudinary.js"
import Notification from "../models/notification.model.js"
import User from "../models/user.model.js"
import Post from "../models/post.model.js"
import { getSocketId, io, userSocketMap } from "../socket.js"

export const getCurrentUser = async (req, res) => {
    try {
        const userId = req.userId
        const user = await User.findById(userId)
            .populate("posts loops story following followers")
        if (!user) {
            return res.status(400).json({ message: "user not found" })
        }
        return res.status(200).json(user)
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
        const { name, userName, bio, profession, gender } = req.body
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

        // FIX: Only upload image if a file was provided
        if (req.file) {
            const profileImage = await uploadOnCloudinary(req.file.path)
            if (profileImage) {
                user.profileImage = profileImage
            } else {
                console.warn("editProfile: Cloudinary upload returned null, keeping old profile image")
            }
        }

        // FIX: Only update fields that are provided (don't overwrite with undefined)
        if (name !== undefined) user.name = name
        if (userName !== undefined) user.userName = userName
        if (bio !== undefined) user.bio = bio
        if (profession !== undefined) user.profession = profession
        if (gender !== undefined) user.gender = gender

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
            .populate("posts loops followers following")
        if (!user) {
            return res.status(404).json({ message: "user not found" })
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
            const receiverSocketId = getSocketId(targetUser._id)
            if (receiverSocketId) {
                io.to(receiverSocketId).emit("newNotification", populatedNotification)
            }

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