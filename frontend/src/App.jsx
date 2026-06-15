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
import { setPostData } from './redux/postSlice'
import { setStoryList, setCurrentUserStory } from './redux/storySlice'
import { setNotificationData, setUserData, setProfileData, setFollowing } from './redux/userSlice'
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

  const { userData, notificationData, profileData } = useSelector(state => state.user)
  const { postData } = useSelector(state => state.post)
  const { storyList } = useSelector(state => state.story)
  const socketRef = useSocket()
  const dispatch = useDispatch()
  const navigate = useNavigate()

  // FIX: Use refs to keep latest Redux slices in socket event handlers.
  const notificationDataRef = useRef(notificationData)
  const postDataRef = useRef(postData)
  const storyListRef = useRef(storyList)
  const profileDataRef = useRef(profileData)

  useEffect(() => {
    notificationDataRef.current = notificationData
  }, [notificationData])
  useEffect(() => {
    postDataRef.current = postData
  }, [postData])
  useEffect(() => {
    storyListRef.current = storyList
  }, [storyList])
  useEffect(() => {
    profileDataRef.current = profileData
  }, [profileData])

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

    const handleNewPost = (newPost) => {
      if (!postDataRef.current.some(post => post._id === newPost._id)) {
        dispatch(setPostData([newPost, ...postDataRef.current]))
      }
    }

    const handleNewStory = (newStory) => {
      if (!storyListRef.current.some(story => story._id === newStory._id)) {
        dispatch(setStoryList([newStory, ...storyListRef.current]))
      }
      if (newStory.author?._id === userData?._id) {
        dispatch(setCurrentUserStory(newStory))
      }
    }

    const handleProfileUpdated = (updatedUser) => {
      if (updatedUser?._id === userData?._id) {
        dispatch(setUserData(updatedUser))
      }
      if (updatedUser?._id === profileDataRef.current?._id) {
        dispatch(setProfileData(updatedUser))
      }
    }

    const handleFollowUpdated = (payload) => {
      if (payload?.userId === userData?._id) {
        dispatch(setFollowing(payload.following || []))
      }
      if (payload?.targetUserId === profileDataRef.current?._id) {
        const existingFollowers = Array.isArray(profileDataRef.current?.followers)
          ? profileDataRef.current.followers
          : []
        const updatedFollowers = payload.isFollowing
          ? [...existingFollowers, userData?._id]
          : existingFollowers.filter(id => id?.toString() !== userData?._id?.toString())
        dispatch(setProfileData({ ...profileDataRef.current, followers: updatedFollowers }))
      }
    }

    socket.on("newNotification", handleNewNotification)
    socket.on("newPost", handleNewPost)
    socket.on("newStory", handleNewStory)
    socket.on("profileUpdated", handleProfileUpdated)
    socket.on("followUpdated", handleFollowUpdated)

    return () => {
      socket.off("newNotification", handleNewNotification)
      socket.off("newPost", handleNewPost)
      socket.off("newStory", handleNewStory)
      socket.off("profileUpdated", handleProfileUpdated)
      socket.off("followUpdated", handleFollowUpdated)
    }
  }, [socketRef?.current, dispatch, userData?._id])

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
