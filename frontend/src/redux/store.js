import { configureStore } from "@reduxjs/toolkit"
import userSlice from "./userSlice"
import postSlice from "./postSlice"
import storySlice from "./storySlice"
import loopSlice from "./loopSlice"
import messageSlice from "./messageSlice"
import socketSlice from "./socketSlice"
import commentSlice from "./commentSlice"
import notificationSlice from "./notificationSlice"
import callSlice from "./callSlice"

const store = configureStore({
    reducer: {
        user: userSlice,
        post: postSlice,
        story: storySlice,
        loop: loopSlice,
        message: messageSlice,
        socket: socketSlice,
        comment: commentSlice,
        notification: notificationSlice,
        call: callSlice,
    }
})

export default store