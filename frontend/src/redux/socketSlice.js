import { createSlice } from "@reduxjs/toolkit"

// BUG FIX (Issue 4): Removed `socket` from Redux state.
// The Socket.io Socket object is NOT serializable (it contains functions,
// EventEmitter instances, etc.) and must NOT live in Redux.
// Socket is now managed in SocketContext (src/context/SocketContext.jsx).
// Only `onlineUsers` (a plain string array) remains here — it IS serializable.
const socketSlice = createSlice({
    name: "socket",
    initialState: {
        onlineUsers: []
    },
    reducers: {
        setOnlineUsers: (state, action) => {
            state.onlineUsers = action.payload
        }
    }
})

export const { setOnlineUsers } = socketSlice.actions
export default socketSlice.reducer