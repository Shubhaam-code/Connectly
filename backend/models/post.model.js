import mongoose from "mongoose";

const postSchema = new mongoose.Schema({
    // author matlab kisne ye post kiya or post to user hi karega
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    mediaType: {
        type: String,
        enum: ["image", "video"],
        required: true
    },
    media: {
        type: String, // kyuki image store hoga claudnary pe or wo dega return me string url
        required: true
    },
    caption:{
        type:String
    },
    likes:[
        {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        }
    ],
    comments:[
        {
        author:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"},
        message:{
            type:String
        }
        }
    ]

}, { timestamps: true })

const Post = mongoose.model("Post",postSchema)
export default Post