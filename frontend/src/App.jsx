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
import getFollowingList from './hooks/getFollowingList'
import getPrevChatUsers from './hooks/getPrevChatUsers'
import Search from './pages/Search'
import getAllNotifications from './hooks/getAllNotifications'
import Notifications from './pages/Notifications'
import { setPostData } from './redux/postSlice'
import { setStoryList, setCurrentUserStory, deleteStoryFromState } from './redux/storySlice'
import { setNotificationData, setUserData, setProfileData, setFollowing, setSuggestedUsers } from './redux/userSlice'
import { setMessages, setPrevChatUsers } from './redux/messageSlice'
import { useSocket } from './context/SocketContext'
import FriendChat from './pages/FriendChat'
import NewsFeed from './pages/NewsFeed'
import Settings from './pages/Settings'
import Explore from './pages/Explore'
import axiosInstance, { SERVER_URL } from './lib/axiosInstance'
import SplashScreen from './components/ui/SplashScreen'

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

  const { userData, notificationData, profileData, suggestedUsers, following, isAuthChecking } = useSelector(state => state.user)
  const { postData } = useSelector(state => state.post)
  const { storyList } = useSelector(state => state.story)
  const { selectedUser, messages, prevChatUsers } = useSelector(state => state.message)
  const socket = useSocket()
  const dispatch = useDispatch()
  const navigate = useNavigate()

  // FIX: Use refs to keep latest Redux slices in socket event handlers.
  const notificationDataRef = useRef(notificationData)
  const postDataRef = useRef(postData)
  const storyListRef = useRef(storyList)
  const profileDataRef = useRef(profileData)
  const selectedUserRef = useRef(selectedUser)
  const messagesRef = useRef(messages)
  const prevChatUsersRef = useRef(prevChatUsers)
  const suggestedUsersRef = useRef(suggestedUsers)

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
  useEffect(() => {
    selectedUserRef.current = selectedUser
  }, [selectedUser])
  useEffect(() => {
    messagesRef.current = messages
  }, [messages])
  useEffect(() => {
    prevChatUsersRef.current = prevChatUsers
  }, [prevChatUsers])
  useEffect(() => {
    suggestedUsersRef.current = suggestedUsers
  }, [suggestedUsers])

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
    if (!socket) return

    const handleNewNotification = (noti) => {
      console.log("[SOCKET DEBUG] New notification received:", noti)
      dispatch(setNotificationData([...notificationDataRef.current, noti]))

      // If notification is for a new message or story reaction, fetch prevChats to sync unread count in real-time
      if (noti.type === "message" || noti.type === "story_reaction") {
        console.log("[SOCKET DEBUG] Message/Reaction notification received, fetching prevChats...")
        axiosInstance.get("/api/message/prevChats")
          .then(res => {
            console.log("[SOCKET DEBUG] prevChats fetched from notification listener:", res.data)
            dispatch(setPrevChatUsers(res.data || []))
          })
          .catch(err => console.error("[SOCKET DEBUG] Error fetching prevChats from notification listener:", err))
      }
    }
    
    // ... other handlers ...
    const handleNewPost = (newPost) => {
      if (!postDataRef.current.some(post => post._id === newPost._id)) {
        dispatch(setPostData([newPost, ...postDataRef.current]))
      }
    }

    const handleNewStory = (newStory) => {
      const authorId = newStory.author?._id?.toString() || newStory.author?.toString()
      const currentUserId = userData?._id?.toString()

      if (authorId !== currentUserId) {
        if (!storyListRef.current.some(story => story._id === newStory._id)) {
          dispatch(setStoryList([newStory, ...storyListRef.current]))
        }
      } else {
        dispatch(setCurrentUserStory(newStory))
      }
    }

    const handleStoryDeleted = (payload) => {
      dispatch(deleteStoryFromState(payload.storyId))
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
        
        axiosInstance.get("/api/user/suggested")
          .then(res => {
            dispatch(setSuggestedUsers(res.data))
          })
          .catch(err => console.error("Error refreshing suggestions:", err))

        if (profileDataRef.current?._id === userData?._id) {
          const existingFollowing = Array.isArray(profileDataRef.current?.following)
            ? profileDataRef.current.following
            : []
          const updatedFollowing = payload.isFollowing
            ? [...existingFollowing, payload.targetUser || { _id: payload.targetUserId }]
            : existingFollowing.filter(f => (f._id || f).toString() !== payload.targetUserId.toString())
          dispatch(setProfileData({ ...profileDataRef.current, following: updatedFollowing }))
        }
      }
      if (payload?.targetUserId === profileDataRef.current?._id) {
        const existingFollowers = Array.isArray(profileDataRef.current?.followers)
          ? profileDataRef.current.followers
          : []
        let updatedFollowers;
        if (payload.isFollowing) {
          const alreadyExists = existingFollowers.some(f => (f._id || f).toString() === payload.userId.toString());
          if (alreadyExists) {
            updatedFollowers = existingFollowers;
          } else {
            updatedFollowers = [...existingFollowers, payload.user || { _id: payload.userId }];
          }
        } else {
          updatedFollowers = existingFollowers.filter(f => (f._id || f).toString() !== payload.userId.toString());
        }
        dispatch(setProfileData({ ...profileDataRef.current, followers: updatedFollowers }))
      }
      if (payload?.targetUserId === userData?._id) {
        const existingFollowers = Array.isArray(userData?.followers) ? userData.followers : []
        let updatedFollowers;
        if (payload.isFollowing) {
          const alreadyExists = existingFollowers.some(f => (f._id || f).toString() === payload.userId.toString());
          if (alreadyExists) {
            updatedFollowers = existingFollowers;
          } else {
            updatedFollowers = [...existingFollowers, payload.user || { _id: payload.userId }];
          }
        } else {
          updatedFollowers = existingFollowers.filter(f => (f._id || f).toString() !== payload.userId.toString());
        }
        dispatch(setUserData({ ...userData, followers: updatedFollowers }))
      }
      if (suggestedUsersRef.current) {
        const updatedSuggestions = suggestedUsersRef.current.map(user => {
          if (user._id.toString() === payload.targetUserId.toString()) {
            const existingFollowers = Array.isArray(user.followers) ? user.followers : [];
            const isAlreadyFollower = existingFollowers.some(f => (f._id || f).toString() === payload.userId.toString());
            let newFollowers;
            if (payload.isFollowing) {
              newFollowers = isAlreadyFollower ? existingFollowers : [...existingFollowers, payload.userId];
            } else {
              newFollowers = existingFollowers.filter(f => (f._id || f).toString() !== payload.userId.toString());
            }
            return { ...user, followers: newFollowers };
          }
          return user;
        });
        dispatch(setSuggestedUsers(updatedSuggestions));
      }
    }

    const handleNewMessage = (mess) => {
      console.log("[SOCKET DEBUG] New message received via socket:", mess)
      const senderIdStr = (mess.sender?._id || mess.sender)?.toString()
      const receiverIdStr = (mess.receiver?._id || mess.receiver)?.toString()
      const currentUserIdStr = userData?._id?.toString()
      
      const otherUserIdStr = senderIdStr === currentUserIdStr ? receiverIdStr : senderIdStr

      const isCurrentChat =
        selectedUserRef.current &&
        selectedUserRef.current._id?.toString() === otherUserIdStr
      console.log("[SOCKET DEBUG] isCurrentChat check:", { isCurrentChat, activeUser: selectedUserRef.current?._id })

      if (isCurrentChat) {
        dispatch(setMessages([...messagesRef.current, mess]))
        axiosInstance.put(`/api/message/seen/${selectedUserRef.current._id}`)
          .then(() => {
            console.log("[SOCKET DEBUG] Marked message as seen, fetching prevChats...")
            return axiosInstance.get("/api/message/prevChats")
          })
          .then(res => {
            console.log("[SOCKET DEBUG] prevChats fetched (active chat override):", res.data)
            dispatch(setPrevChatUsers(res.data || []))
          })
          .catch((err) => console.error("[SOCKET DEBUG] Error marking seen/fetching chats:", err))
      } else {
        console.log("[SOCKET DEBUG] Inactive chat message, fetching prevChats to update unread badge...")
        axiosInstance.get("/api/message/prevChats")
          .then(res => {
            console.log("[SOCKET DEBUG] prevChats fetched (unread increment):", res.data)
            dispatch(setPrevChatUsers(res.data || []))
          })
          .catch(err => console.error("[SOCKET DEBUG] Error fetching prevChats:", err))
      }
    }

    console.log("[SOCKET DEBUG] Registering global socket listeners...")
    socket.on("newNotification", handleNewNotification)
    socket.on("newPost", handleNewPost)
    socket.on("newStory", handleNewStory)
    socket.on("storyDeleted", handleStoryDeleted)
    socket.on("profileUpdated", handleProfileUpdated)
    socket.on("followUpdated", handleFollowUpdated)
    socket.on("newMessage", handleNewMessage)

    return () => {
      socket.off("newNotification", handleNewNotification)
      socket.off("newPost", handleNewPost)
      socket.off("newStory", handleNewStory)
      socket.off("storyDeleted", handleStoryDeleted)
      socket.off("profileUpdated", handleProfileUpdated)
      socket.off("followUpdated", handleFollowUpdated)
      socket.off("newMessage", handleNewMessage)
    }
  }, [socket, dispatch, userData?._id])

  if (isAuthChecking) {
    return <SplashScreen />
  }

  return (
    <Routes>
      {/* Auth routes — logged in users ko redirect karo */}
      <Route path='/signup' element={(!userData || new URLSearchParams(window.location.search).get("addAccount") === "true") ? <SignUp /> : <Navigate to={"/"} />} />
      <Route path='/signin' element={(!userData || new URLSearchParams(window.location.search).get("addAccount") === "true") ? <SignIn /> : <Navigate to={"/"} />} />
      <Route path='/forgot-password' element={!userData ? <ForgotPassword /> : <Navigate to={"/"} />} />

      {/* Protected routes — login ke baad hi access */}
      <Route path='/' element={userData ? <Home /> : <Navigate to={"/signin"} />} />
      <Route path='/profile/:userName' element={userData ? <Profile /> : <Navigate to={"/signin"} />} />
      <Route path='/story/:userName' element={userData ? <Story /> : <Navigate to={"/signin"} />} />
      <Route path='/upload' element={userData ? <Upload /> : <Navigate to={"/signin"} />} />
      <Route path='/search' element={userData ? <Search /> : <Navigate to={"/signin"} />} />
      <Route path='/editprofile' element={userData ? <EditProfile /> : <Navigate to={"/signin"} />} />
      <Route path='/messages' element={userData ? <Messages /> : <Navigate to={"/signin"} />} />
      <Route path='/messageArea' element={userData ? <Messages /> : <Navigate to={"/signin"} />} />
      <Route path='/notifications' element={userData ? <Notifications /> : <Navigate to={"/signin"} />} />
      <Route path='/loops' element={userData ? <Loops /> : <Navigate to={"/signin"} />} />
      <Route path='/chat' element={userData ? <Messages /> : <Navigate to={"/signin"} />} />
      <Route path='/settings' element={userData ? <Settings /> : <Navigate to={"/signin"} />} />
      <Route path='/explore' element={userData ? <Explore /> : <Navigate to={"/signin"} />} />
      <Route path='/news' element={userData ? <NewsFeed /> : <Navigate to={"/signin"} />} />
    </Routes>
  )
}

export default App
