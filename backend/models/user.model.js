import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    userName: {
        type: String,
        required: true,
        unique: true,
        // Explicit index for fast username lookups during login
        index: true,
        trim: true,
        lowercase: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        index: true,
        trim: true,
        lowercase: true
    },
    password: {
        type: String,
        required: true,
        // select:false — password is never returned in queries unless explicitly selected
        // This prevents accidental password exposure in API responses
        select: false
    },
    profileImage: {
        type: String
    },
    bio: {
        type: String
    },
    profession: {
        type: String
    },
    gender: {
        type: String
    },
    followers: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        }
    ],
    following: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        }
    ],
    posts: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Post"
        }
    ],
    saved: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Post"
        }
    ],
    // loop matlab reels
    loops: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Loop"
        }
    ],
    story: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Story"
    },

    // OTP fields for password reset
    resetOtp: {
        type: String
    },
    otpExpires: {
        type: Date
    },
    isOtpVerified: {
        type: Boolean,
        default: false
    },

    // Brute-force protection fields
    loginAttempts: {
        type: Number,
        default: 0
    },
    lockUntil: {
        type: Date
    },

    // Privacy & Preferences
    phone: {
        type: String,
        default: ""
    },
    twoFactorEnabled: {
        type: Boolean,
        default: false
    },
    profileVisibility: {
        type: String,
        enum: ["public", "private"],
        default: "public"
    },
    postVisibility: {
        type: String,
        enum: ["public", "followers"],
        default: "public"
    },
    storyVisibility: {
        type: String,
        enum: ["public", "followers"],
        default: "public"
    },
    messagePermissions: {
        type: String,
        enum: ["everyone", "followers"],
        default: "everyone"
    },
    blockedUsers: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        }
    ],
    mutedUsers: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        }
    ],
    pushNotifications: {
        type: Boolean,
        default: true
    },
    emailNotifications: {
        type: Boolean,
        default: true
    },
    messageNotifications: {
        type: Boolean,
        default: true
    }

}, { timestamps: true })

const User = mongoose.model("User", userSchema)
export default User