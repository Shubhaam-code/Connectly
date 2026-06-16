import express from "express"
import isAuth from "../middlewares/isAuth.js"

import { upload } from "../middlewares/multer.js"
import { getAllMessages, getPrevUserChats, sendMessage, markMessageAsSeen, toggleReaction, editMessage, deleteMessage } from "../controllers/message.controllers.js"

const messageRouter=express.Router()

messageRouter.post("/send/:receiverId",isAuth,upload.single("image"),sendMessage)
messageRouter.get("/getAll/:receiverId",isAuth,getAllMessages)
messageRouter.get("/prevChats",isAuth,getPrevUserChats)
messageRouter.put("/seen/:chatId",isAuth,markMessageAsSeen)
messageRouter.post("/reaction/:messageId",isAuth,toggleReaction)
messageRouter.put("/edit/:messageId",isAuth,editMessage)
messageRouter.delete("/delete/:messageId",isAuth,deleteMessage)

export default messageRouter