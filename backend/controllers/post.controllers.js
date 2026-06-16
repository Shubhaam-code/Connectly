import uploadOnCloudinary from "../config/cloudinary.js";
import Notification from "../models/notification.model.js";
import Post from "../models/post.model.js";
import User from "../models/user.model.js";
import { getSocketId, io } from "../socket.js";

// Helper to parse mentions like @username and create notifications
const handleMentions = async (text, senderId, postId, type = "post") => {
    if (!text) return
    const mentionRegex = /@([a-zA-Z0-9_.]+)/g
    const matches = [...text.matchAll(mentionRegex)]
    const userNames = matches.map(m => m[1].toLowerCase().trim())
    
    if (userNames.length > 0) {
        const uniqueUserNames = [...new Set(userNames)]
        const users = await User.find({ userName: { $in: uniqueUserNames } })
        for (const user of users) {
            if (user._id.toString() !== senderId.toString()) {
                const notification = await Notification.create({
                    sender: senderId,
                    receiver: user._id,
                    type: "mention",
                    post: postId,
                    message: type === "comment" ? "mentioned you in a comment" : "mentioned you in a post"
                })
                const populatedNotification = await Notification.findById(notification._id).populate("sender receiver post")
                const receiverSocketId = getSocketId(user._id)
                if (receiverSocketId) {
                    io.to(receiverSocketId).emit("newNotification", populatedNotification)
                }
            }
        }
    }
}

export const uploadPost = async (req, res) => {
    try {
        // FIX: Log req.body and req.file for debugging upload issues
        console.log("uploadPost called — body:", req.body, "file:", req.file?.originalname)

        const { caption, mediaType } = req.body

        if (!req.file) {
            return res.status(400).json({ message: "Media file is required" })
        }

        if (!mediaType || !["image", "video"].includes(mediaType)) {
            return res.status(400).json({ message: "mediaType must be 'image' or 'video'" })
        }

        const media = await uploadOnCloudinary(req.file.path)

        // FIX: Validate that Cloudinary actually returned a URL.
        // If cloudinary returns null, return a descriptive 500 instead of crashing.
        if (!media) {
            return res.status(500).json({ message: "Failed to upload media to Cloudinary. Check CLOUDINARY credentials in .env" })
        }

        const post = await Post.create({
            caption, media, mediaType, author: req.userId
        })

        if (caption) {
            await handleMentions(caption, req.userId, post._id, "post")
        }

        // FIX: Push post to user.posts array
        const user = await User.findById(req.userId)
        if (user) {
            user.posts.push(post._id)
            await user.save()
        }

        const populatedPost = await Post.findById(post._id)
            .populate("author", "name userName profileImage")

        // Real-time event: broadcast the new post to connected clients
        io.emit("newPost", populatedPost)

        return res.status(201).json(populatedPost)

    } catch (error) {
        console.error("uploadPost error:", error)
        return res.status(500).json({ message: `uploadPost error: ${error.message}` })
    }
}


export const getAllPosts = async (req, res) => {
    try {
        const posts = await Post.find({})
            .populate("author", "name userName profileImage")
            .populate("comments.author", "name userName profileImage")
            .populate("comments.replies.author", "name userName profileImage")
            .sort({ createdAt: -1 })
        return res.status(200).json(posts)
    } catch (error) {
        console.error("getAllPosts error:", error)
        return res.status(500).json({ message: `getallpost error: ${error.message}` })
    }
}

export const like = async (req, res) => {
    try {
        const postId = req.params.postId
        const post = await Post.findById(postId)
        if (!post) {
            return res.status(400).json({ message: "post not found" })
        }

        const alreadyLiked = post.likes.some(id => id.toString() == req.userId.toString())

        if (alreadyLiked) {
            post.likes = post.likes.filter(id => id.toString() != req.userId.toString())
        } else {
            post.likes.push(req.userId)
            // FIX: use .toString() for proper ObjectId comparison
            if (post.author._id.toString() != req.userId.toString()) {
                const notification = await Notification.create({
                    sender: req.userId,
                    receiver: post.author._id,
                    type: "like",
                    post: post._id,
                    message: "liked your post"
                })
                const populatedNotification = await Notification.findById(notification._id).populate("sender receiver post")
                const receiverSocketId = getSocketId(post.author._id)
                if (receiverSocketId) {
                    io.to(receiverSocketId).emit("newNotification", populatedNotification)
                }
            }
        }

        await post.save()
        await post.populate("author", "name userName profileImage")
        await post.populate({ path: "comments.author", select: "name userName profileImage" })
        await post.populate({ path: "comments.replies.author", select: "name userName profileImage" })

        io.emit("likedPost", {
            postId: post._id,
            likes: post.likes
        })
        return res.status(200).json(post)
    } catch (error) {
        console.error("like error:", error)
        return res.status(500).json({ message: `likepost error: ${error.message}` })
    }
}

export const comment = async (req, res) => {
    try {
        const { message, parentCommentId } = req.body
        const postId = req.params.postId
        const post = await Post.findById(postId)
        if (!post) {
            return res.status(400).json({ message: "post not found" })
        }

        if (parentCommentId) {
            // Find parent comment
            const parentComment = post.comments.find(c => c._id.toString() === parentCommentId.toString())
            if (!parentComment) {
                return res.status(404).json({ message: "Parent comment not found" })
            }
            parentComment.replies.push({
                author: req.userId,
                message,
                parentComment: parentComment._id
            })
            parentComment.replyCount = parentComment.replies.length

            // Notify original commenter
            if (parentComment.author.toString() !== req.userId.toString()) {
                const notification = await Notification.create({
                    sender: req.userId,
                    receiver: parentComment.author,
                    type: "reply",
                    post: post._id,
                    message: "replied to your comment"
                })
                const populatedNotification = await Notification.findById(notification._id).populate("sender receiver post")
                const receiverSocketId = getSocketId(parentComment.author)
                if (receiverSocketId) {
                    io.to(receiverSocketId).emit("newNotification", populatedNotification)
                }
            }
        } else {
            // Top level comment
            post.comments.push({
                author: req.userId,
                message
            })
        }

        // Notify Post Owner
        if (post.author._id.toString() !== req.userId.toString()) {
            const notification = await Notification.create({
                sender: req.userId,
                receiver: post.author._id,
                type: "comment",
                post: post._id,
                message: parentCommentId ? "replied to a comment on your post" : "commented on your post"
            })
            const populatedNotification = await Notification.findById(notification._id).populate("sender receiver post")
            const receiverSocketId = getSocketId(post.author._id)
            if (receiverSocketId) {
                io.to(receiverSocketId).emit("newNotification", populatedNotification)
            }
        }
        // Parse and create mention notifications
        if (message) {
            await handleMentions(message, req.userId, post._id, "comment")
        }
        await post.save()
        await post.populate("author", "name userName profileImage")
        await post.populate({ path: "comments.author", select: "name userName profileImage" })
        await post.populate({ path: "comments.replies.author", select: "name userName profileImage" })

        io.emit("commentedPost", {
            postId: post._id,
            comments: post.comments
        })
        return res.status(200).json(post)
    } catch (error) {
        console.error("comment error:", error)
        return res.status(500).json({ message: `comment post error: ${error.message}` })
    }
}

export const likeComment = async (req, res) => {
    try {
        const { postId, commentId } = req.params
        const post = await Post.findById(postId)
        if (!post) {
            return res.status(404).json({ message: "Post not found" })
        }

        const comment = post.comments.find(c => c._id.toString() === commentId.toString())
        if (!comment) {
            return res.status(404).json({ message: "Comment not found" })
        }

        const userIdStr = req.userId.toString()
        const alreadyLiked = comment.likes.some(id => id.toString() === userIdStr)

        if (alreadyLiked) {
            comment.likes = comment.likes.filter(id => id.toString() !== userIdStr)
        } else {
            comment.likes.push(req.userId)
        }

        await post.save()
        await post.populate("author", "name userName profileImage")
        await post.populate({ path: "comments.author", select: "name userName profileImage" })
        await post.populate({ path: "comments.replies.author", select: "name userName profileImage" })

        io.emit("commentedPost", {
            postId: post._id,
            comments: post.comments
        })

        return res.status(200).json(post)
    } catch (error) {
        console.error("likeComment error:", error)
        return res.status(500).json({ message: "Failed to like comment" })
    }
}

export const likeReply = async (req, res) => {
    try {
        const { postId, commentId, replyId } = req.params
        const post = await Post.findById(postId)
        if (!post) {
            return res.status(404).json({ message: "Post not found" })
        }

        const comment = post.comments.find(c => c._id.toString() === commentId.toString())
        if (!comment) {
            return res.status(404).json({ message: "Comment not found" })
        }

        const reply = comment.replies.find(r => r._id.toString() === replyId.toString())
        if (!reply) {
            return res.status(404).json({ message: "Reply not found" })
        }

        const userIdStr = req.userId.toString()
        const alreadyLiked = reply.likes.some(id => id.toString() === userIdStr)

        if (alreadyLiked) {
            reply.likes = reply.likes.filter(id => id.toString() !== userIdStr)
        } else {
            reply.likes.push(req.userId)
        }

        await post.save()
        await post.populate("author", "name userName profileImage")
        await post.populate({ path: "comments.author", select: "name userName profileImage" })
        await post.populate({ path: "comments.replies.author", select: "name userName profileImage" })

        io.emit("commentedPost", {
            postId: post._id,
            comments: post.comments
        })

        return res.status(200).json(post)
    } catch (error) {
        console.error("likeReply error:", error)
        return res.status(500).json({ message: "Failed to like reply" })
    }
}

export const saved = async (req, res) => {
    try {
        const postId = req.params.postId
        const post = await Post.findById(postId)
        if (!post) {
            return res.status(404).json({ message: "post not found" })
        }
        const user = await User.findById(req.userId)
        if (!user) {
            return res.status(400).json({ message: "user not found" })
        }

        const alreadySaved = user.saved.some(id => id.toString() == postId.toString())

        if (alreadySaved) {
            user.saved = user.saved.filter(id => id.toString() != postId.toString())
        } else {
            user.saved.push(postId)

            // Create "save_post" notification
            if (post.author.toString() !== req.userId.toString()) {
                const notification = await Notification.create({
                    sender: req.userId,
                    receiver: post.author,
                    type: "save_post",
                    post: postId,
                    message: "saved your post"
                })
                const populatedNotification = await Notification.findById(notification._id).populate("sender receiver post")
                const receiverSocketId = getSocketId(post.author)
                if (receiverSocketId) {
                    io.to(receiverSocketId).emit("newNotification", populatedNotification)
                }
            }
        }
        await user.save()
        await user.populate("saved")
        return res.status(200).json(user)
    } catch (error) {
        console.error("saved error:", error)
        return res.status(500).json({ message: `saved error: ${error.message}` })
    }
}

// FIX: Added delete post route
export const deletePost = async (req, res) => {
    try {
        const postId = req.params.postId
        const post = await Post.findById(postId)

        if (!post) {
            return res.status(404).json({ message: "Post not found" })
        }

        // Only author can delete their post
        if (post.author.toString() !== req.userId.toString()) {
            return res.status(403).json({ message: "Not authorized to delete this post" })
        }

        await Post.findByIdAndDelete(postId)

        // Remove from user's posts array
        await User.findByIdAndUpdate(req.userId, {
            $pull: { posts: postId }
        })

        return res.status(200).json({ message: "Post deleted successfully" })
    } catch (error) {
        console.error("deletePost error:", error)
        return res.status(500).json({ message: `deletePost error: ${error.message}` })
    }
}