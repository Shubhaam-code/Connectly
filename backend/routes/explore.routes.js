import express from "express"
import {
    getExploreFeed,
    getPhotosFeed,
    getVideosFeed
} from "../controllers/explore.controllers.js"
import isAuth from "../middlewares/isAuth.js"

const exploreRouter = express.Router()

// All explore routes require authentication
exploreRouter.get("/", isAuth, getExploreFeed)
exploreRouter.get("/photos", isAuth, getPhotosFeed)
exploreRouter.get("/videos", isAuth, getVideosFeed)

export default exploreRouter
