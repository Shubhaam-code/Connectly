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
import exploreRouter from "./routes/explore.routes.js"
import newsRouter from "./routes/news.routes.js"
import friendRouter from "./routes/friend.routes.js"
import analyticsRouter from "./routes/analytics.routes.js"
import chatRouter from "./routes/chat.routes.js"
import captionRouter from "./routes/caption.routes.js"

const port = process.env.PORT || 5000

app.set("trust proxy", 1)

const allowedOrigins = [
    "https://connectly-ebon.vercel.app",
    "http://localhost:5173",
    "http://localhost:5174"
]

app.use(cors({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin) || origin.endsWith(".vercel.app")) {
            callback(null, true)
        } else {
            callback(new Error("Not allowed by CORS"))
        }
    },
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
app.use("/api/explore", exploreRouter)
app.use("/api/news", newsRouter)
app.use("/api/friend", friendRouter)
app.use("/api/analytics", analyticsRouter)
app.use("/api/chat", chatRouter)
app.use("/api/caption", captionRouter)

server.on("error", (err) => {
    if (err.code === "EADDRINUSE") {
        console.error(`❌ Port ${port} already in use. Make sure no other server is running on this port.`)
    } else {
        console.error("❌ Server startup error:", err.message)
    }
    process.exit(1)
})

server.on("listening", () => {
    console.log(`✅ Server listening on port ${port}`)
})

server.listen(port, async () => {
    await connectDb()
    await initRedis()
})
