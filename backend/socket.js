import http from "http"
import express from "express"
import { Server } from "socket.io"
import Message from "./models/message.model.js"
const app=express()
const server=http.createServer(app)

const allowedOrigins = [
    "https://connectly-ebon.vercel.app",
    "http://localhost:5173",
    "http://localhost:5174"
]

const io=new Server(server,{
    cors:{
        origin: (origin, callback) => {
            if (!origin || allowedOrigins.includes(origin) || origin.endsWith(".vercel.app")) {
                callback(null, true)
            } else {
                callback(new Error("Not allowed by CORS"))
            }
        },
        methods:["GET","POST"],
        credentials: true
    }
})

export const userSocketMap={}

export const getSocketIds = (receiverId) => {
    return userSocketMap[receiverId] || []
}

export const getSocketId=(receiverId)=>{
    const list = userSocketMap[receiverId]
    return list && list.length > 0 ? list[0] : null
}

export const emitToUser = (userId, event, data) => {
    const socketIds = userSocketMap[userId] || []
    socketIds.forEach(socketId => {
        io.to(socketId).emit(event, data)
    })
}

io.on("connection",(socket)=>{
   const userId=socket.handshake.query.userId
   if(userId && userId !== "undefined"){
       if (!userSocketMap[userId]) {
           userSocketMap[userId] = []
       }
       if (!userSocketMap[userId].includes(socket.id)) {
           userSocketMap[userId].push(socket.id)
       }
       // Mark all undelivered messages received by this user as delivered
       (async () => {
           try {
               const undelivered = await Message.find({ receiver: userId, delivered: false })
               if (undelivered.length > 0) {
                   await Message.updateMany(
                       { receiver: userId, delivered: false },
                       { $set: { delivered: true } }
                   )
                   // Notify distinct senders
                   const senderIds = [...new Set(undelivered.map(m => m.sender.toString()))]
                   senderIds.forEach(senderId => {
                       emitToUser(senderId, "messagesDelivered", { receiverId: userId })
                   })
               }
           } catch (err) {
               console.error("Error marking messages as delivered on connect:", err)
           }
       })()
   }

   io.emit('getOnlineUsers',Object.keys(userSocketMap))  

    socket.on("typing", ({ receiverId }) => {
      const receiverSockets = userSocketMap[receiverId] || []
      receiverSockets.forEach(socketId => {
        io.to(socketId).emit("typing", { senderId: userId })
      })
    })

    socket.on("stopTyping", ({ receiverId }) => {
      const receiverSockets = userSocketMap[receiverId] || []
      receiverSockets.forEach(socketId => {
        io.to(socketId).emit("stopTyping", { senderId: userId })
      })
    })

    // WebRTC call signaling events
    socket.on("callUser", ({ receiverId, callerName, callerProfileImage, callType }) => {
        const receiverSockets = userSocketMap[receiverId] || []
        receiverSockets.forEach(socketId => {
            io.to(socketId).emit("incomingCall", {
                callerId: userId,
                callerName,
                callerProfileImage,
                callType
            })
        })
    })

    socket.on("acceptCall", ({ callerId }) => {
        const callerSockets = userSocketMap[callerId] || []
        callerSockets.forEach(socketId => {
            io.to(socketId).emit("callAccepted", { receiverId: userId })
        })
    })

    socket.on("rejectCall", ({ callerId }) => {
        const callerSockets = userSocketMap[callerId] || []
        callerSockets.forEach(socketId => {
            io.to(socketId).emit("callRejected", { receiverId: userId })
        })
    })

    socket.on("endCall", ({ targetUserId }) => {
        const targetSockets = userSocketMap[targetUserId] || []
        targetSockets.forEach(socketId => {
            io.to(socketId).emit("callEnded", { senderId: userId })
        })
    })

    socket.on("sdpOffer", ({ receiverId, sdp }) => {
        const receiverSockets = userSocketMap[receiverId] || []
        receiverSockets.forEach(socketId => {
            io.to(socketId).emit("sdpOffer", { callerId: userId, sdp })
        })
    })

    socket.on("sdpAnswer", ({ callerId, sdp }) => {
        const callerSockets = userSocketMap[callerId] || []
        callerSockets.forEach(socketId => {
            io.to(socketId).emit("sdpAnswer", { receiverId: userId, sdp })
        })
    })

    socket.on("iceCandidate", ({ targetUserId, candidate }) => {
        const targetSockets = userSocketMap[targetUserId] || []
        targetSockets.forEach(socketId => {
            io.to(socketId).emit("iceCandidate", { senderId: userId, candidate })
        })
    })

    socket.on('disconnect',()=>{
        if (userId && userSocketMap[userId]) {
            userSocketMap[userId] = userSocketMap[userId].filter(id => id !== socket.id)
            if (userSocketMap[userId].length === 0) {
                delete userSocketMap[userId]
            }
        }
        io.emit('getOnlineUsers',Object.keys(userSocketMap))  
    })

})


export {app,io, server}