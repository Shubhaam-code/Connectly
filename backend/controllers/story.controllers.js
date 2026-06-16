import uploadOnCloudinary from "../config/cloudinary.js"
import Story from "../models/story.model.js"
import User from "../models/user.model.js"
import { io, getSocketId } from "../socket.js"

export const uploadStory = async (req, res) => {
    try {
        console.log("[uploadStory] body:", req.body)
        console.log("[uploadStory] file:", req.file)
        console.log("[uploadStory] userId:", req.userId)

        if (!req.userId) {
            return res.status(401).json({ message: "Authentication required" })
        }

        const user = await User.findById(req.userId)
        if (!user) {
            return res.status(404).json({ message: "User not found" })
        }

        const { mediaType } = req.body
        if (!mediaType) {
            return res.status(400).json({ message: "mediaType is required" })
        }

        if (!req.file) {
            return res.status(400).json({ message: "No file uploaded or unsupported form field name. Use 'media' as the field." })
        }

        const media = await uploadOnCloudinary(req.file.path)
        if (!media) {
            return res.status(500).json({ message: "Cloudinary upload failed" })
        }

        const story = await Story.create({
            author: req.userId,
            mediaType,
            media
        })

        user.story = story._id
        await user.save()

        const populatedStory = await Story.findById(story._id)
            .populate("author", "name userName profileImage")
            .populate("viewers", "name userName profileImage")

        // Real-time event: broadcast to the author and the author's followers
        const authorSocketId = getSocketId(req.userId.toString())
        if (authorSocketId) {
            io.to(authorSocketId).emit("newStory", populatedStory)
        }
        if (user.followers && user.followers.length > 0) {
            user.followers.forEach(followerId => {
                const followerSocketId = getSocketId(followerId.toString())
                if (followerSocketId) {
                    io.to(followerSocketId).emit("newStory", populatedStory)
                }
            })
        }

        return res.status(200).json(populatedStory)
    } catch (error) {
        console.error("[uploadStory] error:", error)
        if (error.name === 'ValidationError') {
            return res.status(400).json({ message: `Schema validation failed: ${error.message}` })
        }
        return res.status(500).json({ message: "Story upload failed due to server error" })
    }
}

export const viewStory = async (req, res) => {
    try {
        const storyId = req.params.storyId
        const story = await Story.findById(storyId)

        if (!story) {
            return res.status(400).json({ message: "story not found" })
        }

        const viewersIds = story.viewers.map(id => id.toString())
        if (!viewersIds.includes(req.userId.toString())) {
            story.viewers.push(req.userId)
            await story.save()
        }

        const populatedStory = await Story.findById(story._id).populate("author", "name userName profileImage")
            .populate("viewers", "name userName profileImage")
        return res.status(200).json(populatedStory)
    } catch (error) {
        return res.status(500).json({ message: "story view error" })
    }
}


export const getStoryByUserName = async (req, res) => {
    try {
        const userName = req.params.userName
        const user = await User.findOne({ userName })
        if (!user) {
            return res.status(400).json({ message: "user not found" })
        }

        const story = await Story.find({
            author: user._id
        }).populate("viewers author")

        return res.status(200).json(story)
    } catch (error) {
        return res.status(500).json({ message: "story get by userName error" })
    }
}

export const getAllStories = async (req, res) => {
    try {
        const currentUser = await User.findById(req.userId)
        const followingIds = currentUser.following

        const stories = await Story.find({
            author: { $in: followingIds }
        }).populate("viewers author")
            .sort({ createdAt: -1 })

        return res.status(200).json(stories)


    } catch (error) {
        return res.status(500).json({ message: "All story get error" })
    }
}

export const deleteStory = async (req, res) => {
    try {
        const { storyId } = req.params
        const story = await Story.findById(storyId)
        if (!story) {
            return res.status(404).json({ message: "Story not found" })
        }

        if (story.author.toString() !== req.userId.toString()) {
            return res.status(403).json({ message: "Unauthorized to delete this story" })
        }

        await Story.findByIdAndDelete(storyId)

        // Find next latest story of this user to update user.story
        const nextLatest = await Story.findOne({ author: req.userId }).sort({ createdAt: -1 })
        await User.findByIdAndUpdate(req.userId, {
            story: nextLatest ? nextLatest._id : null
        })

        // Send to author's socket
        const authorSocketId = getSocketId(req.userId.toString())
        if (authorSocketId) {
            io.to(authorSocketId).emit("storyDeleted", { storyId, userId: req.userId })
        }
        // Send to followers
        const user = await User.findById(req.userId)
        if (user && user.followers && user.followers.length > 0) {
            user.followers.forEach(followerId => {
                const followerSocketId = getSocketId(followerId.toString())
                if (followerSocketId) {
                    io.to(followerSocketId).emit("storyDeleted", { storyId, userId: req.userId })
                }
            })
        }

        return res.status(200).json({ message: "Story deleted successfully", storyId })
    } catch (error) {
        console.error("deleteStory error:", error)
        return res.status(500).json({ message: "Delete story failed" })
    }
}