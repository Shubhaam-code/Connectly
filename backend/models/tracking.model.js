import mongoose from "mongoose";

const trackingSchema = new mongoose.Schema({
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true
    },
    eventType: {
        type: String,
        enum: [
            "profile_visit",
            "profile_open",
            "post_impression",
            "profile_impression",
            "story_impression",
            "follow",
            "post_open",
            "post_like",
            "post_comment",
            "post_share"
        ],
        required: true
    },
    visitor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    post: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Post"
    },
    loop: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Loop"
    },
    story: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Story"
    }
}, { timestamps: true });

const Tracking = mongoose.model("Tracking", trackingSchema);
export default Tracking;
