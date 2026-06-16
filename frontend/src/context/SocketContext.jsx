import React, { createContext, useContext, useEffect, useState } from 'react'
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
    
    // HINGLISH: Context value updates correctly when socket is initialized/connected.
    // Consumer components (like App.jsx) re-render immediately to set up socket.on listeners.
    const [socket, setSocket] = useState(null)

    useEffect(() => {
        if (userData) {
            // Create socket connection when user logs in
            const newSocket = io(serverUrl, {
                query: { userId: userData._id }
            })
            setSocket(newSocket)

            newSocket.on('getOnlineUsers', (users) => {
                dispatch(setOnlineUsers(users))
            })

            return () => {
                newSocket.close()
                setSocket(null)
            }
        } else {
            // Close socket if user logs out
            if (socket) {
                socket.close()
                setSocket(null)
            }
        }
    }, [userData, dispatch])

    return (
        <SocketContext.Provider value={socket}>
            {children}
        </SocketContext.Provider>
    )
}

// Custom hook — components call useSocket() to get the socket instance
export function useSocket() {
    return useContext(SocketContext)
}
