import express from "express"
import isAuth from "../middlewares/isAuth.js"

import { upload } from "../middlewares/multer.js"
import { getAllStories, getStoryByUserName, uploadStory, viewStory, deleteStory } from "../controllers/story.controllers.js"



const storyRouter=express.Router()

const storyUploadMiddleware = (req, res, next) => {
    upload.single("media")(req, res, (err) => {
        if (err) {
            console.error("[story upload multer error]", err)
            if (err.code === "LIMIT_FILE_SIZE") {
                return res.status(400).json({ message: "File is too large. Maximum size is 50MB." })
            }
            return res.status(400).json({ message: err.message || "Invalid file upload." })
        }
        next()
    })
}

storyRouter.post("/upload", isAuth, storyUploadMiddleware, uploadStory)
storyRouter.get("/getByUserName/:userName", isAuth, getStoryByUserName)
storyRouter.get("/getAll", isAuth, getAllStories)
storyRouter.get("/view/:storyId", isAuth, viewStory)
storyRouter.delete("/:storyId", isAuth, deleteStory)


export default storyRouter