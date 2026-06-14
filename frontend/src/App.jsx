import React, { useEffect } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import SignUp from './pages/SignUp'
import SignIn from './pages/SignIn'
import ForgotPassword from './pages/ForgotPassword'
import Home from './pages/Home'
import { useDispatch, useSelector } from 'react-redux'
import getCurrentUser from './hooks/getCurrentUser'
import getSuggestedUsers from './hooks/getSuggestedUsers'
import Profile from './pages/Profile'
import EditProfile from './pages/EditProfile'
import Upload from './pages/Upload'
import getAllPost from './hooks/getAllPost'
import Loops from './pages/Loops'
import getAllLoops from './hooks/getAllLoops'
import Story from './pages/Story'
import getAllStories from './hooks/getAllStories'
import Messages from './pages/Messages'
import MessageArea from './pages/MessageArea'
import { io } from "socket.io-client"
import { setOnlineUsers, setSocket } from './redux/socketSlice'
import getFollowingList from './hooks/getFollowingList'
import getPrevChatUsers from './hooks/getPrevChatUsers'
import Search from './pages/Search'
import getAllNotifications from './hooks/getAllNotifications'
import Notifications from './pages/Notifications'
import { setNotificationData } from './redux/userSlice'

// HINGLISH: Nayi pages import kar rahe hain
import AIFriend from './pages/AIFriend'
import Settings from './pages/Settings'

export const serverUrl = "http://localhost:8000"

function App() {
  // HINGLISH: Sab data hooks call ho rahe hain app start pe
  getCurrentUser()
  getSuggestedUsers()
  getAllPost()
  getAllLoops()
  getAllStories()
  getFollowingList()
  getPrevChatUsers()
  getAllNotifications()

  const { userData, notificationData } = useSelector(state => state.user)
  const { socket } = useSelector(state => state.socket)
  const dispatch = useDispatch()

  // HINGLISH: Socket connection — user login ke baad
  useEffect(() => {
    if (userData) {
      const socketIo = io(`${serverUrl}`, {
        query: { userId: userData._id }
      })
      dispatch(setSocket(socketIo))

      socketIo.on('getOnlineUsers', (users) => {
        dispatch(setOnlineUsers(users))
      })

      return () => socketIo.close()
    } else {
      if (socket) {
        socket.close()
        dispatch(setSocket(null))
      }
    }
  }, [userData])

  // HINGLISH: Real-time notifications receive karna
  socket?.on("newNotification", (noti) => {
    dispatch(setNotificationData([...notificationData, noti]))
  })

  return (
    <Routes>
      {/* HINGLISH: Auth routes — logged in users ko redirect karo */}
      <Route path='/signup' element={!userData ? <SignUp /> : <Navigate to={"/"} />} />
      <Route path='/signin' element={!userData ? <SignIn /> : <Navigate to={"/"} />} />
      <Route path='/forgot-password' element={!userData ? <ForgotPassword /> : <Navigate to={"/"} />} />

      {/* HINGLISH: Protected routes — login ke baad hi access */}
      <Route path='/' element={userData ? <Home /> : <Navigate to={"/signin"} />} />
      <Route path='/profile/:userName' element={userData ? <Profile /> : <Navigate to={"/signin"} />} />
      <Route path='/story/:userName' element={userData ? <Story /> : <Navigate to={"/signin"} />} />
      <Route path='/upload' element={userData ? <Upload /> : <Navigate to={"/signin"} />} />
      <Route path='/search' element={userData ? <Search /> : <Navigate to={"/signin"} />} />
      <Route path='/editprofile' element={userData ? <EditProfile /> : <Navigate to={"/signin"} />} />
      <Route path='/messages' element={userData ? <Messages /> : <Navigate to={"/signin"} />} />
      <Route path='/messageArea' element={userData ? <MessageArea /> : <Navigate to={"/signin"} />} />
      <Route path='/notifications' element={userData ? <Notifications /> : <Navigate to={"/signin"} />} />
      <Route path='/loops' element={userData ? <Loops /> : <Navigate to={"/signin"} />} />

      {/* HINGLISH: Nayi routes — AI Friend aur Settings */}
      <Route path='/ai-friend' element={userData ? <AIFriend /> : <Navigate to={"/signin"} />} />
      <Route path='/settings' element={userData ? <Settings /> : <Navigate to={"/signin"} />} />
    </Routes>
  )
}

export default App
