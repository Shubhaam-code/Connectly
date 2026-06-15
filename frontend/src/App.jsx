import React, { useEffect, useRef } from 'react'
import { Navigate, Route, Routes, useNavigate } from 'react-router-dom'
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
import getFollowingList from './hooks/getFollowingList'
import getPrevChatUsers from './hooks/getPrevChatUsers'
import Search from './pages/Search'
import getAllNotifications from './hooks/getAllNotifications'
import Notifications from './pages/Notifications'
import { setNotificationData, setUserData } from './redux/userSlice'
import { useSocket } from './context/SocketContext'
import AIFriend from './pages/AIFriend'
import Settings from './pages/Settings'
import { SERVER_URL } from './lib/axiosInstance'

// serverUrl is exported for any components that build URLs (not for axios calls)
export const serverUrl = SERVER_URL

function App() {
  // HINGLISH: All data-fetching hooks run once at the top level
  getCurrentUser()
  getSuggestedUsers()
  getAllPost()
  getAllLoops()
  getAllStories()
  getFollowingList()
  getPrevChatUsers()
  getAllNotifications()

  const { userData, notificationData } = useSelector(state => state.user)
  const socketRef = useSocket()
  const dispatch = useDispatch()
  const navigate = useNavigate()

  // FIX: Use a ref to always hold the latest notificationData.
  // Without this, the socket event handler closes over the stale initial [] value,
  // causing notifications to overwrite each other instead of appending.
  // Using a ref avoids making notificationData a dependency (which would cause
  // socket.off/socket.on on every new notification → memory leak + missing events).
  const notificationDataRef = useRef(notificationData)
  useEffect(() => {
    notificationDataRef.current = notificationData
  }, [notificationData])

  // ── Auth:logout event ────────────────────────────────────────────────────────
  // axiosInstance dispatches this event when refresh token also fails.
  // We clear Redux user data, which triggers the <Navigate to="/signin" /> guards.
  useEffect(() => {
    const handleLogout = () => {
      dispatch(setUserData(null))
      navigate("/signin")
    }
    window.addEventListener("auth:logout", handleLogout)
    return () => window.removeEventListener("auth:logout", handleLogout)
  }, [dispatch, navigate])

  // ── Socket notification listener ─────────────────────────────────────────────
  // FIX: Removed notificationData from dependency array.
  // Previously: [socketRef?.current, notificationData] caused socket.off/on
  // every time a notification arrived → race condition + missed notifications.
  // Now: uses notificationDataRef.current for latest data without re-registering.
  useEffect(() => {
    const socket = socketRef?.current
    if (!socket) return

    const handleNewNotification = (noti) => {
      dispatch(setNotificationData([...notificationDataRef.current, noti]))
    }

    socket.on("newNotification", handleNewNotification)
    return () => socket.off("newNotification", handleNewNotification)
  }, [socketRef?.current, dispatch])

  return (
    <Routes>
      {/* Auth routes — logged in users ko redirect karo */}
      <Route path='/signup' element={!userData ? <SignUp /> : <Navigate to={"/"} />} />
      <Route path='/signin' element={!userData ? <SignIn /> : <Navigate to={"/"} />} />
      <Route path='/forgot-password' element={!userData ? <ForgotPassword /> : <Navigate to={"/"} />} />

      {/* Protected routes — login ke baad hi access */}
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
      <Route path='/ai-friend' element={userData ? <AIFriend /> : <Navigate to={"/signin"} />} />
      <Route path='/settings' element={userData ? <Settings /> : <Navigate to={"/signin"} />} />
    </Routes>
  )
}

export default App
