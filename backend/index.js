// CRITICAL: 'dotenv/config' MUST be the first import.
import 'dotenv/config'

import express from "express"
import cookieParser from "cookie-parser"
import cors from "cors"
import { app, server } from "./socket.js"
import connectDb from "./config/db.js"
import { initRedis } from "./config/redis.js"
import authRouter from "./routes/auth.routes.js"
import userRouter from "./routes/user.routes.js"
import postRouter from "./routes/post.routes.js"
import loopRouter from "./routes/loop.routes.js"
import storyRouter from "./routes/story.routes.js"
import messageRouter from "./routes/message.routes.js"

const port = process.env.PORT || 5000

app.use(cors({
    origin: ["http://localhost:5173", "http://localhost:5174"],
    credentials: true
}))

app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser())

app.use("/api/auth", authRouter)
app.use("/api/user", userRouter)
app.use("/api/post", postRouter)
app.use("/api/loop", loopRouter)
app.use("/api/story", storyRouter)
app.use("/api/message", messageRouter)

server.listen(port, async () => {
    connectDb()
    await initRedis()
    console.log(`✅ Server running on port ${port}`)
})
