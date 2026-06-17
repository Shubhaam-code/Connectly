import express from "express";
import isAuth from "../middlewares/isAuth.js";
import { upload } from "../middlewares/multer.js";
import { generateCaption } from "../controllers/caption.controllers.js";

const captionRouter = express.Router();

// Route to generate caption from an image upload
captionRouter.post("/generate", isAuth, upload.single("image"), generateCaption);

export default captionRouter;
