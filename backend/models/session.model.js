import mongoose from "mongoose";

const sessionSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true
    },
    refreshToken: {
        type: String,
        required: true,
        index: true
    },
    userAgent: {
        type: String,
        default: "Unknown Device"
    },
    ipAddress: {
        type: String,
        default: "127.0.0.1"
    },
    deviceType: {
        type: String,
        default: "Desktop"
    },
    browserName: {
        type: String,
        default: "Chrome"
    },
    osName: {
        type: String,
        default: "Windows"
    },
    lastActive: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

const Session = mongoose.model("Session", sessionSchema);
export default Session;
