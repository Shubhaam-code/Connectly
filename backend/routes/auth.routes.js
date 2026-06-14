import express from "express"
import { resetPassword, sendOtp, signIn, signOut, signUp, verifyOtp } from "../controllers/auth.controllers.js"

// express.Router() ek Router object return karta hai jisme route define karne aur middleware lagane ke methods hote hain. Ye pura Express app nahi, balki ek mini route manager hai. 🚀
const authRouter=express.Router()

authRouter.post("/signup",signUp)
authRouter.post("/signin",signIn)
authRouter.post("/sendOtp",sendOtp)
authRouter.post("/verifyOtp",verifyOtp)
authRouter.post("/resetPassword",resetPassword)
authRouter.get("/signout",signOut)
export default authRouter