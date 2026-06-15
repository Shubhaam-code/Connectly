import React, { createContext, useContext, useEffect, useRef } from 'react'
import { io } from 'socket.io-client'
import { useDispatch, useSelector } from 'react-redux'
import { setOnlineUsers } from '../redux/socketSlice'
import { serverUrl } from '../App'

// HINGLISH: Socket Context — socket instance ko React Context mein rakhna
// so that Redux mein non-serializable Socket object na aaye (Bug 4 fix).
const SocketContext = createContext(null)

export function SocketProvider({ children }) {
    const { userData } = useSelector(state => state.user)
    const dispatch = useDispatch()
    // BUG FIX (Issue 4): Use useRef to hold the socket instance outside Redux.
    // Redux must only store plain serializable values. Socket objects contain
    // EventEmitters and functions which are NOT serializable — storing them in
    // Redux triggered the "non-serializable value" warning and caused extra
    // re-renders on every socket event.
    const socketRef = useRef(null)

    useEffect(() => {
        if (userData) {
            // Create socket connection when user logs in
            const socket = io(serverUrl, {
                query: { userId: userData._id }
            })
            socketRef.current = socket

            socket.on('getOnlineUsers', (users) => {
                dispatch(setOnlineUsers(users))
            })

            return () => {
                socket.close()
                socketRef.current = null
            }
        } else {
            // Close socket if user logs out
            if (socketRef.current) {
                socketRef.current.close()
                socketRef.current = null
            }
        }
    }, [userData, dispatch])

    return (
        <SocketContext.Provider value={socketRef}>
            {children}
        </SocketContext.Provider>
    )
}

// Custom hook — components call useSocket() to get the socket ref
export function useSocket() {
    return useContext(SocketContext)
}
