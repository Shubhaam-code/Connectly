import uploadOnCloudinary from "../config/cloudinary.js";
import Conversation from "../models/conversation.model.js";
import Message from "../models/message.model.js";
import Notification from "../models/notification.model.js";
import Tracking from "../models/tracking.model.js";
import Post from "../models/post.model.js";
import User from "../models/user.model.js";
import { getSocketId, io, emitToUser } from "../socket.js";

export const sendMessage = async (req, res) => {
    try {
        const senderId = req.userId
        const receiverId = req.params.receiverId
        const { message, replyTo, sharedPost, sharedLoop, sharedStory, messageType, audioDuration } = req.body

        let image;
        let video;
        let audioUrl;

        if (req.file) {
            const uploadedUrl = await uploadOnCloudinary(req.file.path)
            if (!uploadedUrl) {
                return res.status(500).json({ message: "Failed to upload file to Cloudinary" })
            }
            if (req.file.mimetype.startsWith("video/")) {
                video = uploadedUrl
            } else if (req.file.mimetype.startsWith("audio/")) {
                audioUrl = uploadedUrl
            } else {
                image = uploadedUrl
            }
        }

        const isReceiverOnline = !!getSocketId(receiverId)

        const messageData = {
            sender: senderId,
            receiver: receiverId,
            message,
            messageType: messageType || "text",
            delivered: isReceiverOnline
        }

        if (image) {
            messageData.image = image
            messageData.messageType = "image"
        }
        if (video) {
            messageData.video = video
            messageData.messageType = "video"
        }
        if (audioUrl) {
            messageData.audioUrl = audioUrl
            messageData.messageType = "audio"
            messageData.audioDuration = audioDuration ? parseFloat(audioDuration) : 0
        }
        if (replyTo) messageData.replyTo = replyTo
        if (sharedPost) messageData.sharedPost = sharedPost
        if (sharedLoop) messageData.sharedLoop = sharedLoop
        if (sharedStory) messageData.sharedStory = sharedStory

        const newMessage = await Message.create(messageData)

        // Track post share event in analytics
        if (sharedPost) {
            const postDoc = await Post.findById(sharedPost)
            if (postDoc && postDoc.author.toString() !== senderId.toString()) {
                await Tracking.create({
                    owner: postDoc.author,
                    eventType: "post_share",
                    visitor: senderId,
                    post: sharedPost
                })
            }
        }

        let conversation = await Conversation.findOne({
            participants: { $all: [senderId, receiverId] }
        })
        if (!conversation) {
            conversation = await Conversation.create({
                participants: [senderId, receiverId],
                messages: [newMessage._id]
            })
        } else {
            conversation.messages.push(newMessage._id)
            await conversation.save()
        }

        const populatedMessage = await Message.findById(newMessage._id)
            .populate("sender", "name userName profileImage")
            .populate("receiver", "name userName profileImage")
            .populate("replyTo")
            .populate({
                path: "sharedPost",
                populate: { path: "author", select: "name userName profileImage" }
            })
            .populate({
                path: "sharedLoop",
                populate: { path: "author", select: "name userName profileImage" }
            })
            .populate({
                path: "sharedStory",
                populate: { path: "author", select: "name userName profileImage" }
            })

        const msgObj = populatedMessage.toObject()
        if (populatedMessage._doc.sharedPost && !populatedMessage.sharedPost) {
            msgObj.sharedPostDeleted = true
        }
        if (populatedMessage._doc.sharedLoop && !populatedMessage.sharedLoop) {
            msgObj.sharedLoopDeleted = true
        }
        if (populatedMessage._doc.sharedStory && !populatedMessage.sharedStory) {
            msgObj.sharedStoryDeleted = true
        }

        emitToUser(receiverId, "newMessage", msgObj)
        emitToUser(senderId, "newMessage", msgObj)

        // Create a notification for the receiver
        const notiType = sharedStory ? "story_reaction" : "message"
        const notiMessage = sharedStory ? "reacted to your story" : "sent you a message"
        
        const notification = await Notification.create({
            sender: senderId,
            receiver: receiverId,
            type: notiType,
            message: notiMessage
        })

        const populatedNotification = await Notification.findById(notification._id)
            .populate("sender", "name userName profileImage")
            .populate("receiver", "name userName profileImage")

        emitToUser(receiverId, "newNotification", populatedNotification)

        return res.status(200).json(msgObj)
    } catch (error) {
        console.error("sendMessage error:", error)
        return res.status(500).json({ message: `send Message error: ${error.message}` })
    }
}

export const getAllMessages = async (req, res) => {
    try {
        const senderId = req.userId
        const receiverId = req.params.receiverId
        const conversation = await Conversation.findOne({
            participants: { $all: [senderId, receiverId] }
        }).populate({
            path: "messages",
            populate: [
                { path: "sender", select: "name userName profileImage" },
                { path: "receiver", select: "name userName profileImage" },
                { path: "replyTo" },
                { path: "sharedPost", populate: { path: "author", select: "name userName profileImage" } },
                { path: "sharedLoop", populate: { path: "author", select: "name userName profileImage" } },
                { path: "sharedStory", populate: { path: "author", select: "name userName profileImage" } }
            ]
        })

        const messages = conversation?.messages || []
        const processedMessages = messages.map(msg => {
            const msgObj = msg.toObject()
            if (msg._doc.sharedPost && !msg.sharedPost) {
                msgObj.sharedPostDeleted = true
            }
            if (msg._doc.sharedLoop && !msg.sharedLoop) {
                msgObj.sharedLoopDeleted = true
            }
            if (msg._doc.sharedStory && !msg.sharedStory) {
                msgObj.sharedStoryDeleted = true
            }
            return msgObj
        })

        return res.status(200).json(processedMessages)

    } catch (error) {
        console.error("getAllMessages error:", error)
        return res.status(500).json({ message: `get Message error: ${error.message}` })
    }
}

export const getPrevUserChats = async (req, res) => {
    try {
        const currentUserId = req.userId

        const conversations = await Conversation.find({
            participants: currentUserId
        }).populate("participants")

        const prevChats = await Promise.all(conversations.map(async (conv) => {
            const otherUser = conv.participants.find(p => p._id.toString() !== currentUserId.toString())
            if (!otherUser) return null;

            let lastMessage = null;
            if (conv.messages && conv.messages.length > 0) {
                const lastMessageId = conv.messages[conv.messages.length - 1];
                lastMessage = await Message.findById(lastMessageId);
            }

            const unreadCount = await Message.countDocuments({
                sender: otherUser._id,
                receiver: currentUserId,
                seen: false
            });

            return {
                user: otherUser,
                lastMessage: lastMessage ? lastMessage.message : "",
                lastMessageMedia: lastMessage ? (lastMessage.image ? "image" : lastMessage.video ? "video" : lastMessage.audioUrl ? "audio" : null) : null,
                lastMessageSender: lastMessage ? lastMessage.sender : null,
                lastMessageTimestamp: lastMessage ? lastMessage.createdAt : conv.updatedAt,
                unreadCount
            }
        }));

        const sortedChats = prevChats
            .filter(chat => chat !== null)
            .sort((a, b) => new Date(b.lastMessageTimestamp) - new Date(a.lastMessageTimestamp))

        return res.status(200).json(sortedChats)

    } catch (error) {
        console.error("getPrevUserChats error:", error)
        return res.status(500).json({ message: `prev user error: ${error.message}` })
    }
}

export const markMessageAsSeen = async (req, res) => {
    try {
        const currentUserId = req.userId
        const { chatId } = req.params // ChatId is the other participant's user id

        await Message.updateMany(
            { sender: chatId, receiver: currentUserId, seen: false },
            { $set: { seen: true, delivered: true } }
        )

        emitToUser(chatId, "messagesSeen", { viewerId: currentUserId })

        return res.status(200).json({ message: "Messages marked as seen" })
    } catch (error) {
        console.error("markMessageAsSeen error:", error)
        return res.status(500).json({ message: "Failed to mark messages as seen" })
    }
}

export const toggleReaction = async (req, res) => {
    try {
        const currentUserId = req.userId
        const { messageId } = req.params
        const { emoji } = req.body

        const message = await Message.findById(messageId)
        if (!message) {
            return res.status(404).json({ message: "Message not found" })
        }

        // Toggle logic
        const existingIdx = message.reactions.findIndex(
            r => r.user.toString() === currentUserId.toString()
        )

        if (existingIdx > -1) {
            if (message.reactions[existingIdx].emoji === emoji) {
                // Remove reaction if same emoji
                message.reactions.splice(existingIdx, 1)
            } else {
                // Update emoji
                message.reactions[existingIdx].emoji = emoji
            }
        } else {
            // Add reaction
            message.reactions.push({ user: currentUserId, emoji })
        }

        await message.save()
        await message.populate("reactions.user", "name userName profileImage")

        // Broadcast to other participant
        const targetUserId = message.sender.toString() === currentUserId.toString() ? message.receiver : message.sender
        emitToUser(targetUserId, "messageReaction", {
            messageId: message._id,
            reactions: message.reactions
        })
        emitToUser(currentUserId, "messageReaction", {
            messageId: message._id,
            reactions: message.reactions
        })

        return res.status(200).json(message)
    } catch (error) {
        console.error("toggleReaction error:", error)
        return res.status(500).json({ message: "Failed to toggle reaction" })
    }
}

export const editMessage = async (req, res) => {
    try {
        const currentUserId = req.userId
        const { messageId } = req.params
        const { message: newText } = req.body

        const message = await Message.findById(messageId)
        if (!message) {
            return res.status(404).json({ message: "Message not found" })
        }

        if (message.sender.toString() !== currentUserId.toString()) {
            return res.status(403).json({ message: "Unauthorized to edit this message" })
        }

        message.message = newText
        message.isEdited = true
        await message.save()

        const targetUserId = message.receiver
        emitToUser(targetUserId, "messageEdited", {
            messageId: message._id,
            message: newText,
            isEdited: true
        })
        emitToUser(currentUserId, "messageEdited", {
            messageId: message._id,
            message: newText,
            isEdited: true
        })

        return res.status(200).json(message)
    } catch (error) {
        console.error("editMessage error:", error)
        return res.status(500).json({ message: "Failed to edit message" })
    }
}

export const deleteMessage = async (req, res) => {
    try {
        const currentUserId = req.userId
        const { messageId } = req.params

        const message = await Message.findById(messageId)
        if (!message) {
            return res.status(404).json({ message: "Message not found" })
        }

        if (message.sender.toString() !== currentUserId.toString()) {
            return res.status(403).json({ message: "Unauthorized to delete this message" })
        }

        message.message = "This message was deleted"
        message.image = undefined
        message.video = undefined
        message.isDeleted = true
        await message.save()

        const targetUserId = message.receiver
        emitToUser(targetUserId, "messageDeleted", {
            messageId: message._id,
            isDeleted: true
        })
        emitToUser(currentUserId, "messageDeleted", {
            messageId: message._id,
            isDeleted: true
        })

        return res.status(200).json(message)
    } catch (error) {
        console.error("deleteMessage error:", error)
        return res.status(500).json({ message: "Failed to delete message" })
    }
}