import express from "express"
import isAuth from "../middlewares/isAuth.js"

import { upload } from "../middlewares/multer.js"
import {
    comment,
    deletePost,
    getAllPosts,
    like,
    saved,
    uploadPost,
    likeComment,
    likeReply,
    trackPostOpen,
    trackPostImpression
} from "../controllers/post.controllers.js"

const postRouter = express.Router()

postRouter.post("/upload", isAuth, upload.single("media"), uploadPost)
postRouter.get("/getAll", isAuth, getAllPosts)
postRouter.get("/like/:postId", isAuth, like)
postRouter.get("/saved/:postId", isAuth, saved)
postRouter.post("/comment/:postId", isAuth, comment)
postRouter.get("/comment/like/:postId/:commentId", isAuth, likeComment)
postRouter.get("/comment/reply/like/:postId/:commentId/:replyId", isAuth, likeReply)
postRouter.delete("/delete/:postId", isAuth, deletePost)

// New analytics tracking routes
postRouter.post("/track/open/:postId", isAuth, trackPostOpen)
postRouter.post("/track/impression", isAuth, trackPostImpression)

export default postRouter