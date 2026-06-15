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
    }

}, { timestamps: true })

const User = mongoose.model("User", userSchema)
export default User