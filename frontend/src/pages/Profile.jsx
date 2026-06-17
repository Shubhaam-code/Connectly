import axiosInstance from '../lib/axiosInstance'
import React, { useEffect, useState, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { setProfileData, setUserData } from '../redux/userSlice'
import { setPostData } from '../redux/postSlice'
import { FiSettings, FiGrid, FiVideo, FiBookmark, FiHeart, FiMessageCircle, FiLogOut, FiArrowLeft, FiSearch, FiX, FiBarChart2, FiPlus, FiMinus, FiRotateCcw, FiImage, FiTrash2, FiUsers, FiUserCheck, FiPlusSquare, FiSend, FiChevronDown } from 'react-icons/fi'
import dp from "../assets/dp.webp"
import Layout from '../components/layout/Layout'
import FollowButton from '../components/FollowButton'
import PostModal from '../components/posts/PostModal'
import { setSelectedUser } from '../redux/messageSlice'
import { motion, AnimatePresence } from 'framer-motion'
import { StoryViewer } from '../components/stories/StoryViewer'
import { Avatar } from '../components/ui/UIComponents'
import CreatorInsights from '../components/profile/CreatorInsights'

// HINGLISH: Profile page — user ka premium profile screen with grid + stats, Instagram desktop look.
function Profile() {
  const { userName } = useParams()
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const [postType, setPostType] = useState("posts")
  const [profileLoading, setProfileLoading] = useState(true)
  const [showFollowModal, setShowFollowModal] = useState(false)
  const [followModalType, setFollowModalType] = useState("followers") // "followers" | "following"
  const [followSearch, setFollowSearch] = useState("")
  const [savedPosts, setSavedPosts] = useState([])
  const [savedLoading, setSavedLoading] = useState(false)
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [viewMode, setViewMode] = useState(() => localStorage.getItem("profile_viewMode") || "grid")
  const [sortOption, setSortOption] = useState(() => localStorage.getItem("profile_sortOption") || "latest")
  const [dropdownOpen, setDropdownOpen] = useState(false)

  useEffect(() => {
    localStorage.setItem("profile_viewMode", viewMode)
  }, [viewMode])

  useEffect(() => {
    localStorage.setItem("profile_sortOption", sortOption)
  }, [sortOption])

  useEffect(() => {
    const checkDark = () => {
      setIsDarkMode(document.documentElement.classList.contains("dark"))
    }
    checkDark()
    const observer = new MutationObserver(checkDark)
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] })
    return () => observer.disconnect()
  }, [])

  const coverImageSrc = isDarkMode ? "/bgdark.jpg" : "/bglight.jpg"

  // New states for Avatar options & Zoom preview & Stories
  const [profileStories, setProfileStories] = useState([])
  const [viewingStoryGroup, setViewingStoryGroup] = useState(null)
  const [showAvatarOptions, setShowAvatarOptions] = useState(false)
  const [showPhotoPreview, setShowPhotoPreview] = useState(false)
  const [zoomScale, setZoomScale] = useState(1)
  const fileInputRef = useRef(null)

  // New states for Creator Analytics
  const [analyticsData, setAnalyticsData] = useState(null)
  const [analyticsPeriod, setAnalyticsPeriod] = useState("7days")
  const [analyticsLoading, setAnalyticsLoading] = useState(false)

  const openFollowModal = (type) => {
    setFollowModalType(type)
    setFollowSearch("")
    setShowFollowModal(true)
  }

  const { profileData, userData } = useSelector(state => state.user)
  const { postData } = useSelector(state => state.post)
  const { loopData } = useSelector(state => state.loop)
  const notificationData = useSelector(state => state.user.notificationData) || []

  const isOwnProfile = profileData?._id === userData?._id

  // Modal navigation / viewing states
  const [selectedPostIndex, setSelectedPostIndex] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const handleProfile = async () => {
    setProfileLoading(true)
    try {
      const result = await axiosInstance.get(`/api/user/getProfile/${userName}`)
      dispatch(setProfileData(result.data))
    } catch (error) {
      console.error("getProfile error:", error.message)
    } finally {
      setProfileLoading(false)
    }
  }

  const handleLogOut = async () => {
    try {
      await axiosInstance.get("/api/auth/signout")
      dispatch(setUserData(null))
      navigate("/signin")
    } catch (error) {
      console.error("logout error:", error.message)
      dispatch(setUserData(null))
      navigate("/signin")
    }
  }

  useEffect(() => {
    handleProfile()
  }, [userName, dispatch])

  useEffect(() => {
    const fetchStories = async () => {
      try {
        const res = await axiosInstance.get(`/api/story/getByUserName/${userName}`)
        setProfileStories(res.data)
      } catch (err) {
        console.error("fetchStories error:", err)
      }
    }
    fetchStories()
  }, [userName])

  useEffect(() => {
    if (postType === "analytics" && isOwnProfile) {
      const fetchAnalytics = async () => {
        setAnalyticsLoading(true)
        try {
          const res = await axiosInstance.get(`/api/user/analytics?period=${analyticsPeriod}`)
          setAnalyticsData(res.data)
        } catch (err) {
          console.error("fetchAnalytics error:", err)
        } finally {
          setAnalyticsLoading(false)
        }
      }
      fetchAnalytics()
    }
  }, [postType, analyticsPeriod, isOwnProfile])

  const handleFileChange = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    const formData = new FormData()
    formData.append("profileImage", file)
    try {
      const res = await axiosInstance.post("/api/user/editProfile", formData)
      dispatch(setProfileData(res.data))
      dispatch(setUserData(res.data))
      alert("Profile photo updated successfully!")
    } catch (error) {
      console.error(error)
      alert("Failed to update profile photo: " + (error.response?.data?.message || error.message))
    }
  }

  const handleRemovePhoto = async () => {
    if (window.confirm("Are you sure you want to remove your profile photo?")) {
      try {
        const res = await axiosInstance.post("/api/user/editProfile", { removeProfileImage: true })
        dispatch(setProfileData(res.data))
        dispatch(setUserData(res.data))
        alert("Profile photo removed successfully!")
      } catch (error) {
        console.error(error)
        alert("Failed to remove profile photo: " + (error.response?.data?.message || error.message))
      }
    }
  }



  useEffect(() => {
    if (postType === "saved" && isOwnProfile) {
      const fetchSavedPosts = async () => {
        setSavedLoading(true)
        try {
          const result = await axiosInstance.get("/api/user/saved-posts")
          setSavedPosts(result.data)
        } catch (error) {
          console.error("fetchSavedPosts error:", error.message)
        } finally {
          setSavedLoading(false)
        }
      }
      fetchSavedPosts()
    }
  }, [postType, isOwnProfile])

  // Filter posts, loops and saved posts safely
  const userPosts = postData?.filter(post => {
    const authorId = post.author?._id || post.author
    return authorId?.toString() === profileData?._id?.toString()
  }) || []

  const userLoops = loopData?.filter(loop => {
    const authorId = loop.author?._id || loop.author
    return authorId?.toString() === profileData?._id?.toString()
  }) || []

  const filteredSavedPosts = savedPosts.filter(post => {
    return userData?.saved?.some(savedId => (savedId?._id || savedId)?.toString() === post?._id?.toString())
  })

  // Determine which list to display
  let displayPosts = []
  if (postType === "posts") {
    displayPosts = [...userPosts]
  } else if (postType === "loops") {
    displayPosts = [...userLoops]
  } else if (postType === "saved") {
    displayPosts = [...filteredSavedPosts]
  }

  // Sort displayPosts dynamically based on sortOption
  if (sortOption === "latest") {
    displayPosts.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
  } else if (sortOption === "oldest") {
    displayPosts.sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0))
  } else if (sortOption === "likes") {
    displayPosts.sort((a, b) => (b.likes?.length || 0) - (a.likes?.length || 0))
  } else if (sortOption === "comments") {
    displayPosts.sort((a, b) => (b.comments?.length || 0) - (a.comments?.length || 0))
  }

  const currentModalPost = selectedPostIndex !== null ? displayPosts[selectedPostIndex] : null

  // Keyboard controls for modal navigation
  useEffect(() => {
    if (selectedPostIndex === null || !isModalOpen) return
    const handleKeyDown = (e) => {
      if (e.key === "ArrowLeft" && selectedPostIndex > 0) {
        setSelectedPostIndex(prev => prev - 1)
      } else if (e.key === "ArrowRight" && selectedPostIndex < displayPosts.length - 1) {
        setSelectedPostIndex(prev => prev + 1)
      } else if (e.key === "Escape") {
        setIsModalOpen(false)
        setSelectedPostIndex(null)
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [selectedPostIndex, displayPosts.length, isModalOpen])

  // Liking/commenting handlers for PostModal
  const handleLikeToggle = (postId) => {
    const updatedPosts = postData.map(post => {
      if (post._id === postId) {
        const hasLiked = post.likes.includes(userData._id)
        const newLikes = hasLiked
          ? post.likes.filter(id => id !== userData._id)
          : [...post.likes, userData._id]
        return { ...post, likes: newLikes }
      }
      return post
    })
    dispatch(setPostData(updatedPosts))
  }

  const handleCommentAdded = (postId, newComments) => {
    const updatedPosts = postData.map(post => {
      if (post._id === postId) {
        return { ...post, comments: newComments }
      }
      return post
    })
    dispatch(setPostData(updatedPosts))
  }

  const handleProfileLike = async (e, post) => {
    e.stopPropagation()
    const isLiked = post.likes.some(id => id.toString() === userData._id.toString())
    const optimisticLikes = isLiked
      ? post.likes.filter(id => id.toString() !== userData._id.toString())
      : [...post.likes, userData._id]

    const optimisticPosts = postData.map(p =>
      p._id === post._id ? { ...p, likes: optimisticLikes } : p
    )
    dispatch(setPostData(optimisticPosts))

    try {
      const result = await axiosInstance.get(`/api/post/like/${post._id}`)
      const updatedPosts = postData.map(p => p._id === post._id ? result.data : p)
      dispatch(setPostData(updatedPosts))
    } catch (error) {
      dispatch(setPostData(postData))
      console.error("handleProfileLike error:", error.message)
    }
  }

  const handleProfileSave = async (e, post) => {
    e.stopPropagation()
    try {
      const result = await axiosInstance.get(`/api/post/saved/${post._id}`)
      dispatch(setUserData(result.data))
      if (postType === "saved") {
        setSavedPosts(prev => prev.filter(p => p._id !== post._id))
      }
    } catch (error) {
      console.error("handleProfileSave error:", error.message)
    }
  }

  if (profileLoading && (!profileData || profileData.userName?.toLowerCase() !== userName?.toLowerCase())) {
    return (
      <Layout>
        <div className="w-full h-full flex items-center justify-center bg-[var(--background)]">
          <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </Layout>
    )
  }

  const unreadNotifications = notificationData.filter(n => !n.isRead).length

  return (
    <Layout>
      <div className="w-full max-w-5xl mx-auto px-4 py-4 space-y-6 bg-[var(--background)] text-[var(--text)] min-h-screen flex flex-col select-none">

        {/* Mobile Sticky / Top header */}
        <div className="flex items-center justify-between border-b border-[var(--border)] pb-3 md:hidden">
          <button className="p-2 rounded-xl bg-[var(--card)] border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text)] transition-colors cursor-pointer" onClick={() => navigate('/')}>
            <FiArrowLeft size={18} />
          </button>
          <span className="font-bold text-sm tracking-wide text-[var(--text)]">{profileData?.userName}</span>
          <button className="p-2 rounded-xl bg-[var(--card)] border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text)] transition-colors cursor-pointer" onClick={() => isOwnProfile ? navigate('/settings') : null}>
            <FiSettings size={18} />
          </button>
        </div>

        {/* Desktop Topbar matching reference design */}
        <div className="hidden md:flex items-center justify-end w-full pb-2">
          {/* Actions */}
          <div className="flex items-center gap-4">
            {/* Theme Toggle */}
            <button
              onClick={() => {
                const newTheme = isDarkMode ? "light" : "dark"
                document.documentElement.classList.add(newTheme)
                document.documentElement.classList.remove(isDarkMode ? "dark" : "light")
                localStorage.setItem("theme", newTheme)
                setIsDarkMode(!isDarkMode)
              }}
              className="p-2.5 rounded-xl bg-[var(--card)] border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text)] transition-colors cursor-pointer"
            >
              {isDarkMode ? (
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" /><line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" /><line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" /><line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" /></svg>
              ) : (
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" /></svg>
              )}
            </button>

            {/* Notifications Bell */}
            <button
              onClick={() => navigate('/notifications')}
              className="relative p-2.5 rounded-xl bg-[var(--card)] border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text)] transition-colors cursor-pointer"
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
              {unreadNotifications > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-black rounded-full w-4 h-4 flex items-center justify-center shadow-md shadow-red-500/10">
                  {unreadNotifications > 9 ? "9+" : unreadNotifications}
                </span>
              )}
            </button>

            {/* Create Button */}
            <button
              onClick={() => navigate('/upload')}
              className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition-all hover:shadow-[0_8px_20px_rgba(139,92,246,0.35)] cursor-pointer flex items-center gap-1.5"
            >
              <FiPlusSquare size={14} className="stroke-[2.5]" /> + Create
            </button>
          </div>
        </div>

        {/* ===== PREMIUM PROFILE HERO SECTION ===== */}
        {/* Cover image is the hero. Avatar + info overlay on top of it. */}
        <div className="profile-hero-wrapper relative w-full flex-shrink-0">
          {/* Cover Image Hero */}
          <div
            className="profile-hero-cover relative w-full rounded-[24px] overflow-hidden bg-cover bg-center shadow-[0_8px_40px_rgba(0,0,0,0.4)]"
            style={{ backgroundImage: `url(${coverImageSrc})` }}
          >
            {/* Gradient overlay for text readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/10 z-[1]" />

            {/* Desktop: User info positioned ON the cover */}
            <div className="hidden md:flex relative z-[2] items-end w-full h-full px-8 pb-8 pt-32">
              {/* Avatar floating on the cover — bottom-aligned */}
              <div className="relative flex-shrink-0 cursor-pointer" onClick={() => setShowAvatarOptions(true)}>
                <div className="w-[140px] h-[140px] lg:w-[160px] lg:h-[160px] rounded-full p-[3px] bg-gradient-to-tr from-[#8B5CF6] via-[#EC4899] to-[#3B82F6] shadow-[0_0_30px_rgba(139,92,246,0.4)] transition-transform duration-300 hover:scale-[1.03]">
                  <div className="w-full h-full rounded-full overflow-hidden border-[4px] border-[var(--background)] bg-[#0B1220] shadow-xl">
                    <Avatar
                      src={profileData?.profileImage || dp}
                      alt={profileData?.userName}
                      size="w-full h-full"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
                {profileData?.isOnline && (
                  <span className="absolute bottom-2 right-2 w-5 h-5 bg-green-500 border-[3px] border-[var(--background)] rounded-full shadow-[0_0_12px_#22c55e] z-10" />
                )}
              </div>

              {/* Info Column — beside avatar, on the cover */}
              <div className="flex-1 flex flex-col items-start text-left ml-6 select-none pb-1">
                {/* Name + Verification */}
                <div className="flex flex-wrap items-center gap-2.5 mb-1">
                  <h1 className="text-2xl lg:text-3xl font-black tracking-tight text-white flex items-center gap-2 leading-none drop-shadow-lg">
                    {profileData?.name}
                    {profileData?.isVerified && (
                      <svg viewBox="0 0 24 24" className="w-6 h-6 lg:w-7 lg:h-7 fill-blue-400 flex-shrink-0 drop-shadow-md" title="Verified Creator">
                        <path d="M12.003 21.602c-5.305 0-9.602-4.298-9.602-9.602s4.298-9.602 9.602-9.602c5.305 0 9.602 4.298 9.602 9.602s-4.298 9.602-9.602 9.602zm-1.802-5.402l6.602-6.601-1.401-1.401-5.201 5.2-2.201-2.201-1.4 1.401 3.601 3.602z" />
                      </svg>
                    )}
                  </h1>
                  <span className="px-2.5 py-0.5 rounded-md text-[9px] font-extrabold uppercase tracking-wider bg-white/15 text-white/90 border border-white/20 backdrop-blur-md shadow-sm">
                    {profileData?.profession || "CONNECTLY Creator"}
                  </span>
                </div>

                {/* Username */}
                <p className="text-sm font-semibold text-white/70 mb-2">@{profileData?.userName}</p>

                {/* Bio */}
                <p className="text-sm text-white/75 line-clamp-2 max-w-xl font-normal leading-relaxed mb-2">
                  {profileData?.bio || "Connecting, expressing, and building digital things."}
                </p>

                {/* Location */}
                <p className="text-xs text-white/60 flex items-center gap-1.5 font-semibold mb-4">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
                  {profileData?.location || "India"}
                </p>

                {/* Action Buttons */}
                <div className="flex flex-wrap items-center gap-2.5">
                  {isOwnProfile ? (
                    <>
                      <button
                        onClick={() => navigate('/editprofile')}
                        className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-[#8B5CF6] hover:bg-[#A855F7] hover:shadow-[0_4px_16px_rgba(139,92,246,0.45)] transition-all cursor-pointer flex-shrink-0"
                      >
                        Edit Profile
                      </button>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(window.location.href)
                          alert("Profile link copied to clipboard! 🔗")
                        }}
                        className="px-4.5 py-2.5 rounded-xl text-xs font-bold text-white/90 bg-white/10 border border-white/20 hover:bg-white/20 backdrop-blur-sm transition-all cursor-pointer flex-shrink-0"
                      >
                        Share Profile
                      </button>
                    </>
                  ) : (
                    <>
                      <FollowButton
                        targetUserId={profileData?._id}
                        onFollowChange={handleProfile}
                        tailwind="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-[#8B5CF6] hover:bg-[#A855F7] transition-all flex-shrink-0"
                      />
                      <button
                        onClick={() => {
                          dispatch(setSelectedUser(profileData))
                          navigate('/messages')
                        }}
                        className="px-4.5 py-2.5 rounded-xl text-xs font-bold text-white/90 bg-white/10 border border-white/20 hover:bg-white/20 backdrop-blur-sm transition-all cursor-pointer flex-shrink-0"
                      >
                        Message
                      </button>
                    </>
                  )}
                  <button className="p-2.5 rounded-xl bg-white/10 border border-white/20 text-white/70 hover:text-white hover:bg-white/20 backdrop-blur-sm transition-all cursor-pointer flex-shrink-0">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /><circle cx="5" cy="12" r="1" /></svg>
                  </button>
                </div>
              </div>
            </div>

            {/* Mobile: Only the cover image content area (avatar placed outside via absolute) */}
            <div className="md:hidden h-[180px] sm:h-[220px] relative z-[2]" />
          </div>

          {/* Mobile: Avatar overlapping bottom of cover */}
          <div className="md:hidden relative z-10 -mt-16 sm:-mt-20 px-4">
            {/* Avatar */}
            <div className="relative flex-shrink-0 cursor-pointer w-fit" onClick={() => setShowAvatarOptions(true)}>
              <div className="w-[100px] h-[100px] sm:w-[120px] sm:h-[120px] rounded-full p-[3px] bg-gradient-to-tr from-[#8B5CF6] via-[#EC4899] to-[#3B82F6] shadow-[0_0_20px_rgba(139,92,246,0.35)] transition-transform duration-300 hover:scale-[1.03]">
                <div className="w-full h-full rounded-full overflow-hidden border-[4px] border-[var(--background)] bg-[#0B1220] shadow-lg">
                  <Avatar
                    src={profileData?.profileImage || dp}
                    alt={profileData?.userName}
                    size="w-full h-full"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
              {profileData?.isOnline && (
                <span className="absolute bottom-1 right-1 w-4 h-4 bg-green-500 border-[3px] border-[var(--background)] rounded-full shadow-[0_0_10px_#22c55e] z-10" />
              )}
            </div>

            {/* Mobile User Info */}
            <div className="flex flex-col items-start text-left w-full select-none text-[var(--text)] mt-3">
              {/* Name & Badge */}
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h1 className="text-xl font-black tracking-tight text-[var(--text)] flex items-center gap-1.5 leading-none">
                  {profileData?.name}
                  {profileData?.isVerified && (
                    <svg viewBox="0 0 24 24" className="w-5 h-5 fill-blue-500 flex-shrink-0" title="Verified Creator">
                      <path d="M12.003 21.602c-5.305 0-9.602-4.298-9.602-9.602s4.298-9.602 9.602-9.602c5.305 0 9.602 4.298 9.602 9.602s-4.298 9.602-9.602 9.602zm-1.802-5.402l6.602-6.601-1.401-1.401-5.201 5.2-2.201-2.201-1.4 1.401 3.601 3.602z" />
                    </svg>
                  )}
                </h1>
                <span className="px-2.5 py-0.5 rounded text-[8px] font-extrabold uppercase tracking-wider bg-[#8B5CF6]/15 text-[#8B5CF6] border border-[#8B5CF6]/20 dark:bg-[#8B5CF6]/30 dark:text-purple-200 dark:border-[#8B5CF6]/30 backdrop-blur-md">
                  {profileData?.profession || "CONNECTLY Creator"}
                </span>
              </div>

              {/* Username */}
              <p className="text-xs font-semibold text-[var(--text-secondary)] mb-2">@{profileData?.userName}</p>

              {/* Bio */}
              <p className="text-xs text-[var(--text-secondary)] line-clamp-3 max-w-sm font-normal leading-relaxed mb-2">
                {profileData?.bio || "Connecting, expressing, and building digital things."}
              </p>

              {/* Location */}
              <p className="text-[10px] text-[var(--text-secondary)] flex items-center gap-1 font-semibold mb-4">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
                {profileData?.location || "India"}
              </p>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2">
                {isOwnProfile ? (
                  <>
                    <button
                      onClick={() => navigate('/editprofile')}
                      className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#8B5CF6] hover:bg-[#A855F7] hover:shadow-[0_4px_12px_rgba(139,92,246,0.3)] transition-all cursor-pointer flex-shrink-0"
                    >
                      Edit Profile
                    </button>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(window.location.href)
                        alert("Profile link copied to clipboard! 🔗")
                      }}
                      className="px-3.5 py-2 rounded-xl text-xs font-bold text-[var(--text)] bg-[var(--card)] border border-[var(--border)] hover:bg-[var(--hover)] transition-all cursor-pointer flex-shrink-0"
                    >
                      Share Profile
                    </button>
                  </>
                ) : (
                  <>
                    <FollowButton
                      targetUserId={profileData?._id}
                      onFollowChange={handleProfile}
                      tailwind="px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#8B5CF6] hover:bg-[#A855F7] transition-all flex-shrink-0"
                    />
                    <button
                      onClick={() => {
                        dispatch(setSelectedUser(profileData))
                        navigate('/messages')
                      }}
                      className="px-3.5 py-2 rounded-xl text-xs font-bold text-[var(--text)] bg-[var(--card)] border border-[var(--border)] hover:bg-[var(--hover)] transition-all cursor-pointer flex-shrink-0"
                    >
                      Message
                    </button>
                  </>
                )}
                <button className="p-2 rounded-xl bg-[var(--card)] border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text)] transition-all cursor-pointer flex-shrink-0">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /><circle cx="5" cy="12" r="1" /></svg>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Creator Stats Cards Grid */}
        <div className={`grid grid-cols-2 ${isOwnProfile ? 'sm:grid-cols-5' : 'sm:grid-cols-4'} gap-3 sm:gap-4 w-full pt-4`}>
          {[
            { label: "Posts", val: profileData?.posts?.length || 0, onClick: () => setPostType("posts") },
            { label: "Loops", val: profileData?.loops?.length || 0, onClick: () => setPostType("loops") },
            ...(isOwnProfile ? [{ label: "Saved", val: userData?.saved?.length || 0, onClick: () => setPostType("saved") }] : []),
            { label: "Followers", val: profileData?.followers?.length || 0, onClick: () => openFollowModal("followers") },
            { label: "Following", val: profileData?.following?.length || 0, onClick: () => openFollowModal("following") }
          ].map((stat) => (
            <button
              key={stat.label}
              onClick={stat.onClick}
              className={`bg-[var(--card)]/90 backdrop-blur-lg border border-[var(--border)] hover:border-purple-500/20 hover:shadow-[0_8px_30px_rgba(139,92,246,0.06)] hover:-translate-y-1 rounded-2xl p-4 flex flex-col items-center justify-center gap-1 transition-all duration-300 group cursor-pointer text-center ${
                stat.label === "Saved" ? "hidden sm:flex" : "flex"
              }`}
            >
              <span className="text-lg sm:text-xl md:text-2xl font-black text-[var(--text)] group-hover:text-purple-400 transition-colors">
                {stat.val}
              </span>
              <span className="text-[9px] sm:text-[10px] md:text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">
                {stat.label}
              </span>
            </button>
          ))}
        </div>

        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*"
          className="hidden"
        />

        <div className="h-[1px] w-full bg-[var(--border)] my-2" />

        {/* Tab Row (Instagram Style sticky row with dropdown controls) */}
        <div className="sticky top-0 z-30 bg-[var(--background)]/90 backdrop-blur-md border-b border-[var(--border)] py-1 mb-2 flex items-center justify-between">
          <div className="flex justify-center gap-6 sm:gap-10">
            {[
              { id: "posts", label: "POSTS", icon: <FiGrid size={13} /> },
              { id: "loops", label: "LOOPS", icon: <FiVideo size={13} /> },
              ...(isOwnProfile ? [
                { id: "saved", label: "SAVED", icon: <FiBookmark size={13} /> },
                { id: "analytics", label: "ANALYTICS", icon: <FiBarChart2 size={13} /> }
              ] : [])
            ].map((tab) => {
              const active = postType === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setPostType(tab.id)}
                  className={`flex items-center gap-2 py-3.5 text-xs font-bold tracking-widest relative transition-colors cursor-pointer ${active ? "text-purple-500 font-extrabold" : "text-[var(--text-secondary)] hover:text-[var(--text)]"
                    }`}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                  {active && (
                    <motion.div
                      layoutId="activeTabLine"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-500 rounded-full"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                </button>
              );
            })}
          </div>

          {/* Right layout and filter controls */}
          <div className="hidden sm:flex items-center gap-3">
            {/* Sorting Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="px-3 h-8 flex items-center justify-between gap-1.5 rounded-xl border border-[var(--border)] text-[10px] font-extrabold text-[var(--text)] bg-[var(--card)] hover:border-[#8B5CF6]/50 focus:border-[#8B5CF6] focus:ring-1 focus:ring-[#8B5CF6]/30 transition-all uppercase tracking-wider outline-none cursor-pointer"
              >
                <span>{sortOption === "latest" ? "Latest" : sortOption === "oldest" ? "Oldest" : sortOption === "likes" ? "Most Liked" : "Most Commented"}</span>
                <FiChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${dropdownOpen ? 'rotate-180 text-purple-400' : ''}`} />
              </button>
              {dropdownOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setDropdownOpen(false)} />
                  <div className="absolute right-0 mt-2 w-40 rounded-xl bg-[var(--card)] border border-[var(--border)] shadow-[0_10px_25px_rgba(0,0,0,0.15)] dark:shadow-[0_10px_25px_rgba(0,0,0,0.4)] z-50 overflow-hidden py-1">
                    {[
                      { value: "latest", label: "Latest" },
                      { value: "oldest", label: "Oldest" },
                      { value: "likes", label: "Most Liked" },
                      { value: "comments", label: "Most Commented" }
                    ].map(option => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => {
                          setSortOption(option.value)
                          setDropdownOpen(false)
                        }}
                        className={`w-full text-left px-4 py-2.5 text-[10px] font-extrabold uppercase tracking-wider transition-all duration-150 cursor-pointer ${
                          sortOption === option.value
                            ? "bg-purple-500/10 text-purple-500 dark:text-purple-400 font-black"
                            : "text-[var(--text-secondary)] hover:bg-purple-500/5 hover:text-purple-500 dark:hover:text-purple-400"
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Layout Switchers */}
            <button
              onClick={() => setViewMode("grid")}
              className={`p-1.5 rounded-lg border transition-all cursor-pointer ${viewMode === "grid"
                  ? "text-purple-400 bg-purple-500/10 border-purple-500/20"
                  : "text-[var(--text-secondary)] hover:text-white border-transparent hover:bg-white/5"
                }`}
              title="Grid view"
            >
              <FiGrid size={13} />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-1.5 rounded-lg border transition-all cursor-pointer ${viewMode === "list"
                  ? "text-purple-400 bg-purple-500/10 border-purple-500/20"
                  : "text-[var(--text-secondary)] hover:text-white border-transparent hover:bg-white/5"
                }`}
              title="List view"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" /><line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" /></svg>
            </button>
          </div>
        </div>

        {/* 3-Column Posts Media Grid or Analytics View */}
        {postType === "analytics" && isOwnProfile ? (
          <div className="space-y-6 mt-4 animate-fade-in">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[var(--border)] pb-4">
              <div>
                <h3 className="text-lg font-bold text-[var(--text)]">Creator Analytics</h3>
                <p className="text-xs text-[var(--text-secondary)]">Monitor your audience reach and content engagement</p>
              </div>
              {/* Period Toggle Capsules */}
              <div className="flex bg-[var(--card)] border border-[var(--border)] p-1 rounded-xl">
                {["today", "7days", "30days"].map((p) => (
                  <button
                    key={p}
                    onClick={() => setAnalyticsPeriod(p)}
                    className={`px-3.5 py-1.5 rounded-lg text-[10px] md:text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer ${analyticsPeriod === p
                      ? "bg-[var(--primary)] text-white shadow-md shadow-[var(--primary)]/20"
                      : "text-[var(--text-secondary)] hover:text-[var(--text)]"
                      }`}
                  >
                    {p === "today" ? "Today" : p === "7days" ? "7 Days" : "30 Days"}
                  </button>
                ))}
              </div>
            </div>

            {analyticsLoading ? (
              <div className="flex justify-center items-center py-20">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500"></div>
              </div>
            ) : (
              <div className="w-full">
                <CreatorInsights
                  likes={analyticsData?.likes || 0}
                  impressions={analyticsData?.impressions || 0}
                  visitors={analyticsData?.reach || 0}
                  saves={analyticsData?.saves || 0}
                  loading={analyticsLoading}
                  posts={userPosts}
                />
              </div>
            )}
          </div>
        ) : displayPosts.length > 0 ? (
          <>
            {/* Media Cards Grid or List Feed */}
            {viewMode === "grid" ? (
              <div className="grid grid-cols-3 gap-2 sm:gap-4 mt-4 animate-fade-in">
                {displayPosts.map((post, index) => {
                  const isVideo = post.mediaType === "video" || postType === "loops"
                  const caption = post.caption || ""

                  return (
                    <div
                      key={post._id || index}
                      onClick={() => {
                        setSelectedPostIndex(index)
                        setIsModalOpen(true)
                      }}
                      className="aspect-square w-full rounded-[14px] sm:rounded-2xl overflow-hidden bg-[var(--card)] border border-[var(--border)] relative group cursor-pointer shadow-sm hover:shadow-md transition-all duration-300"
                    >
                      {/* Thumbnail Media */}
                      {post.media && !post.media.includes("placeholder") ? (
                        isVideo ? (
                          <div className="w-full h-full relative">
                            <video
                              src={post.media}
                              className="w-full h-full object-cover"
                              muted
                              loop
                              playsInline
                            />
                            <div className="absolute top-2.5 right-2.5 z-10 text-white bg-black/40 p-1.5 rounded-lg backdrop-blur-sm">
                              <FiVideo size={12} />
                            </div>
                          </div>
                        ) : (
                          <img
                            src={post.media}
                            alt=""
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                            loading="lazy"
                          />
                        )
                      ) : (
                        /* Beautiful text/gradient style for text-only or code-only posts */
                        <div className="w-full h-full bg-gradient-to-br from-[#8B5CF6]/10 via-[#A855F7]/5 to-[#EC4899]/10 flex flex-col justify-between p-3.5 sm:p-5 relative select-none">
                          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-white/5 flex items-center justify-center border border-white/10">
                            {post.category === "code" ? <FiGrid className="text-purple-400 text-xs sm:text-sm" /> : <FiGrid className="text-pink-400 text-xs sm:text-sm" />}
                          </div>
                          <p className="text-[9px] sm:text-xs text-[var(--text-secondary)] font-medium line-clamp-3 sm:line-clamp-4 leading-relaxed text-left">
                            {caption || "No content"}
                          </p>
                          <span className="text-[7px] sm:text-[8px] font-bold text-white/30 tracking-widest uppercase">CONNECTLY</span>
                        </div>
                      )}

                      {/* Premium Desktop Hover Overlay showing Likes & Comments */}
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-4 sm:gap-6 text-white text-xs sm:text-sm font-extrabold select-none z-10">
                        <div className="flex items-center gap-1.5">
                          <FiHeart size={15} className="fill-white stroke-white" />
                          <span>{post.likes?.length || 0}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <FiMessageCircle size={15} className="fill-white stroke-white" />
                          <span>{post.comments?.length || 0}</span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center gap-6 mt-4 max-w-xl mx-auto w-full animate-fade-in">
                {displayPosts.map((post, index) => {
                  const isVideo = post.mediaType === "video" || postType === "loops"

                  const caption = post.caption || ""
                  let title = caption
                  let code = null
                  let lang = "code"

                  const codeRegex = /```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/
                  const match = caption.match(codeRegex)
                  if (match) {
                    lang = match[1] || "code"
                    code = match[2].trim()
                    title = caption.replace(codeRegex, "").trim()
                  }

                  const titleLines = title.split("\n").map(l => l.trim()).filter(Boolean)
                  const cleanTitle = titleLines[0] || "Snippet"

                  let tag = "CODE"
                  const upperTitle = cleanTitle.toUpperCase()
                  if (lang.toUpperCase() === "PYTHON" || upperTitle.includes("PYTHON")) {
                    tag = "PYTHON"
                  } else if (upperTitle.includes("UI") || upperTitle.includes("UX") || upperTitle.includes("DESIGN") || upperTitle.includes("MAINTENANCE") || upperTitle.includes("BUILDING")) {
                    tag = "UI/UX"
                  } else if (upperTitle.includes("LOGO") || upperTitle.includes("REVEAL") || upperTitle.includes("UPDATE")) {
                    tag = "UPDATE"
                  }

                  const hasCode = code !== null || post.category === "code" || tag === "PYTHON" || tag === "CODE"

                  return (
                    <div
                      key={post._id || index}
                      onClick={() => {
                        setSelectedPostIndex(index)
                        setIsModalOpen(true)
                      }}
                      className="w-full bg-[var(--card)] border border-[var(--border)] rounded-[24px] p-5 flex flex-col space-y-4 shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer text-left"
                    >
                      {/* Feed Item Header */}
                      <div className="flex items-center gap-3">
                        <Avatar
                          src={profileData?.profileImage || dp}
                          alt={profileData?.userName}
                          size="w-9 h-9"
                          className="border border-[var(--border)]"
                        />
                        <div>
                          <div className="flex items-center gap-1">
                            <span className="text-xs font-bold text-[var(--text)]">{profileData?.userName}</span>
                            {profileData?.isVerified && (
                              <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-blue-500 flex-shrink-0">
                                <path d="M12.003 21.602c-5.305 0-9.602-4.298-9.602-9.602s4.298-9.602 9.602-9.602c5.305 0 9.602 4.298 9.602 9.602s-4.298 9.602-9.602 9.602zm-1.802-5.402l6.602-6.601-1.401-1.401-5.201 5.2-2.201-2.201-1.4 1.401 3.601 3.602z" />
                              </svg>
                            )}
                          </div>
                          <p className="text-[9px] text-[var(--text-secondary)]">@{profileData?.name}</p>
                        </div>
                      </div>

                      {/* Media Section */}
                      <div className="aspect-[16/10] w-full rounded-xl overflow-hidden relative bg-[var(--background-secondary)]">
                        {post.media && !post.media.includes("placeholder") ? (
                          isVideo ? (
                            <video
                              src={post.media}
                              className="w-full h-full object-cover"
                              muted
                              loop
                              playsInline
                            />
                          ) : (
                            <img
                              src={post.media}
                              alt=""
                              className="w-full h-full object-cover"
                              loading="lazy"
                            />
                          )
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-[#8B5CF6]/20 via-[#A855F7]/10 to-[#EC4899]/20 flex items-center justify-center relative">
                            <div className="absolute w-24 h-24 rounded-full bg-purple-500/10 blur-2xl top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
                            <FiImage size={24} className="text-[var(--text-secondary)] opacity-45" />
                          </div>
                        )}

                        {/* STORY Badge Overlay */}
                        {(post.type === "story" || post.category === "story") && (
                          <div className="absolute top-2.5 left-2.5 z-10">
                            <span className="px-2.5 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider bg-red-500/90 text-white shadow-md">
                              STORY
                            </span>
                          </div>
                        )}

                        {isVideo && (
                          <div className="absolute top-2.5 right-2.5 text-white/80 z-10 bg-black/40 p-1.5 rounded-lg">
                            <FiVideo size={13} />
                          </div>
                        )}
                      </div>

                      {/* Caption */}
                      <p className="text-xs text-[var(--text)] leading-relaxed text-left">
                        {caption || "No caption"}
                      </p>

                      {/* Footer Engagement */}
                      <div className="flex items-center justify-between pt-3 border-t border-[var(--border)] text-[var(--text-secondary)]">
                        <div className="flex items-center gap-4">
                          {/* Like Button */}
                          <button
                            onClick={(e) => handleProfileLike(e, post)}
                            className={`flex items-center gap-1.5 text-xs font-bold transition-colors ${post.likes.some(id => id.toString() === userData._id.toString())
                                ? "text-pink-500"
                                : "hover:text-pink-500"
                              }`}
                          >
                            <FiHeart
                              size={15}
                              className={post.likes.some(id => id.toString() === userData._id.toString()) ? "fill-pink-500 stroke-pink-500" : ""}
                            />
                            {post.likes?.length || 0}
                          </button>

                          {/* Comment Button */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedPostIndex(index);
                              setIsModalOpen(true);
                            }}
                            className="flex items-center gap-1.5 text-xs font-bold hover:text-purple-500 transition-colors"
                          >
                            <FiMessageCircle size={15} />
                            {post.comments?.length || 0}
                          </button>

                          {/* Share Button */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedPostIndex(index);
                              setIsModalOpen(true);
                            }}
                            className="hover:text-green-500 transition-colors p-0.5 rounded-full"
                          >
                            <FiSend size={15} />
                          </button>
                        </div>

                        {/* Save Button */}
                        <button
                          onClick={(e) => handleProfileSave(e, post)}
                          className={`transition-colors ${userData?.saved?.some(id => (id?._id || id)?.toString() === post?._id?.toString())
                              ? "text-amber-500"
                              : "hover:text-amber-500"
                            }`}
                        >
                          <FiBookmark
                            size={15}
                            className={userData?.saved?.some(id => (id?._id || id)?.toString() === post?._id?.toString()) ? "fill-amber-500 stroke-amber-500" : ""}
                          />
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-4 bg-[var(--card)] border border-[var(--border)] rounded-[20px] p-6 shadow-[var(--shadow-premium)]">
            <div className="w-16 h-16 rounded-full border border-[var(--border)] flex items-center justify-center text-gray-500">
              {postType === "posts" ? <FiGrid size={24} /> : postType === "loops" ? <FiVideo size={24} /> : <FiBookmark size={24} />}
            </div>
            <h3 className="font-semibold text-lg">
              No {postType === "posts" ? "Posts" : postType === "loops" ? "Loops" : "Saved Posts"} Yet
            </h3>
            {isOwnProfile && postType === "posts" && (
              <button
                onClick={() => navigate('/upload')}
                className="px-6 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#8B5CF6] to-[#A855F7] hover:shadow-[0_8px_20px_rgba(139,92,246,0.3)] transition-all cursor-pointer"
              >
                Share your first post
              </button>
            )}
          </div>
        )}
      </div>

      {/* Post Modal with full pagination and sync */}
      {isModalOpen && currentModalPost && (
        <PostModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false)
            setSelectedPostIndex(null)
          }}
          post={currentModalPost}
          onPrevious={() => setSelectedPostIndex(prev => prev - 1)}
          onNext={() => setSelectedPostIndex(prev => prev + 1)}
          canNavigatePrev={selectedPostIndex > 0}
          canNavigateNext={selectedPostIndex < displayPosts.length - 1}
          onLikeToggle={handleLikeToggle}
          onCommentAdded={handleCommentAdded}
        />
      )}

      {/* Followers / Following Modal */}
      <AnimatePresence>
        {showFollowModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 z-[999] flex items-center justify-center p-4"
            onClick={() => setShowFollowModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[var(--card)] border border-[var(--border)] rounded-2xl w-full max-w-sm overflow-hidden flex flex-col max-h-[80vh]"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="px-5 py-4 border-b border-[var(--border)] flex items-center justify-between flex-shrink-0">
                <span className="text-sm font-bold capitalize text-[var(--text)]">
                  {followModalType === "followers" ? "Followers" : "Following"}
                </span>
                <button
                  onClick={() => setShowFollowModal(false)}
                  className="text-[var(--text-secondary)] hover:text-[var(--text)] cursor-pointer"
                >
                  <FiX size={18} />
                </button>
              </div>

              {/* Search Bar */}
              <div className="p-4 border-b border-[var(--border)] flex-shrink-0">
                <div className="flex items-center gap-2.5 px-3 py-2 bg-[var(--background-secondary)] rounded-xl text-xs text-[var(--text-secondary)] border border-[var(--border)] focus-within:border-[var(--primary)]">
                  <FiSearch size={14} />
                  <input
                    type="text"
                    placeholder="Search..."
                    value={followSearch}
                    onChange={(e) => setFollowSearch(e.target.value)}
                    className="w-full text-xs text-[var(--text)] bg-transparent outline-none placeholder:text-[var(--text-secondary)]"
                  />
                </div>
              </div>

              {/* List Area */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {(() => {
                  const usersList = followModalType === "followers"
                    ? (profileData?.followers || [])
                    : (profileData?.following || []);

                  const filteredList = usersList.filter(user =>
                    user.userName?.toLowerCase().includes(followSearch.toLowerCase()) ||
                    user.name?.toLowerCase().includes(followSearch.toLowerCase())
                  );

                  if (filteredList.length === 0) {
                    return (
                      <p className="text-center text-xs text-[var(--text-secondary)] py-10">
                        No creators found
                      </p>
                    );
                  }

                  return filteredList.map((user) => {
                    const isMutual = userData?.following?.some(id => (id._id || id).toString() === user._id.toString()) &&
                      userData?.followers?.some(id => (id._id || id).toString() === user._id.toString());
                    return (
                      <div key={user._id} className="flex items-center justify-between gap-3 animate-fade-in">
                        <div
                          className="flex items-center gap-3 cursor-pointer flex-1 min-w-0"
                          onClick={() => {
                            setShowFollowModal(false)
                            navigate(`/profile/${user.userName}`)
                          }}
                        >
                          <Avatar
                            src={user.profileImage || dp}
                            alt={user.userName}
                            size="w-10 h-10"
                            className="bg-[var(--background-secondary)] flex-shrink-0"
                          />
                          <div className="truncate">
                            <div className="flex items-center gap-1.5">
                              <p className="text-xs font-semibold text-[var(--text)] truncate">{user.userName}</p>
                              {isMutual && (
                                <span className="px-1.5 py-0.5 rounded text-[8px] bg-[var(--primary)]/10 text-[var(--primary)] font-bold tracking-wide border border-[var(--primary)]/20">
                                  Mutual
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-[var(--text-secondary)] truncate">{user.name}</p>
                          </div>
                        </div>

                        {/* Follow Button */}
                        <FollowButton
                          targetUserId={user._id}
                          tailwind="px-3 py-1.5 rounded-lg text-[10px] font-bold btn-gradient hover-scale flex-shrink-0"
                          onFollowChange={() => {
                            // Update details to trigger re-render of profile counts
                            handleProfile();
                          }}
                        />
                      </div>
                    );
                  });
                })()}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Story Viewer Modal */}
      {viewingStoryGroup && (
        <StoryViewer
          groupedStories={viewingStoryGroup}
          initialUserIndex={0}
          onClose={() => setViewingStoryGroup(null)}
        />
      )}

      {/* Avatar Click Options Modal */}
      <AnimatePresence>
        {showAvatarOptions && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 z-[999] flex items-center justify-center p-4"
            onClick={() => setShowAvatarOptions(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[var(--card)] border border-[var(--border)] rounded-2xl w-full max-w-xs overflow-hidden flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="px-5 py-4 border-b border-[var(--border)] text-center">
                <span className="text-sm font-bold text-[var(--text)]">Profile Photo Options</span>
              </div>
              <div className="flex flex-col text-sm">
                {profileStories.length > 0 && (
                  <button
                    onClick={() => {
                      setShowAvatarOptions(false)
                      setViewingStoryGroup([{
                        _id: profileData?._id,
                        username: profileData?.userName,
                        avatar: profileData?.profileImage,
                        stories: profileStories
                      }])
                    }}
                    className="py-3.5 border-b border-[var(--border)] text-[var(--primary)] font-bold hover:bg-[var(--hover)] transition-all cursor-pointer"
                  >
                    View Story
                  </button>
                )}
                <button
                  onClick={() => {
                    setShowAvatarOptions(false)
                    setShowPhotoPreview(true)
                    setZoomScale(1)
                  }}
                  className="py-3.5 border-b border-[var(--border)] text-[var(--text)] hover:bg-[var(--hover)] transition-all cursor-pointer"
                >
                  View Profile Photo
                </button>
                {isOwnProfile && (
                  <>
                    <button
                      onClick={() => {
                        setShowAvatarOptions(false)
                        fileInputRef.current?.click()
                      }}
                      className="py-3.5 border-b border-[var(--border)] text-blue-500 dark:text-blue-400 hover:bg-[var(--hover)] transition-all font-semibold cursor-pointer"
                    >
                      Change Profile Photo
                    </button>
                    {profileData?.profileImage && (
                      <button
                        onClick={() => {
                          setShowAvatarOptions(false)
                          handleRemovePhoto()
                        }}
                        className="py-3.5 text-red-500 hover:bg-[var(--hover)] transition-all font-semibold cursor-pointer"
                      >
                        Remove Profile Photo
                      </button>
                    )}
                  </>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Zoom Profile Photo Preview Modal */}
      <AnimatePresence>
        {showPhotoPreview && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/95 z-[999] flex flex-col items-center justify-center p-4 select-none"
            onClick={() => setShowPhotoPreview(false)}
            onWheel={(e) => {
              if (e.deltaY < 0) {
                setZoomScale(prev => Math.min(prev + 0.2, 4))
              } else {
                setZoomScale(prev => Math.max(prev - 0.2, 1))
              }
            }}
          >
            {/* Top Close Button & Zoom Details */}
            <div className="absolute top-4 right-4 flex items-center gap-4 z-[1000]" onClick={(e) => e.stopPropagation()}>
              <span className="text-xs text-gray-400">Scroll to Zoom (Scale: {zoomScale.toFixed(1)}x)</span>
              <button
                onClick={() => setShowPhotoPreview(false)}
                className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors cursor-pointer"
              >
                <FiX size={20} />
              </button>
            </div>

            {/* Scale buttons at the bottom */}
            <div className="absolute bottom-6 flex gap-4 z-[1000]" onClick={(e) => e.stopPropagation()}>
              <button
                onClick={() => setZoomScale(prev => Math.min(prev + 0.2, 4))}
                className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors flex items-center justify-center cursor-pointer"
                title="Zoom In"
              >
                <FiPlus size={20} />
              </button>
              <button
                onClick={() => setZoomScale(1)}
                className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors flex items-center justify-center cursor-pointer"
                title="Reset Zoom"
              >
                <FiRotateCcw size={20} />
              </button>
              <button
                onClick={() => setZoomScale(prev => Math.max(prev - 0.2, 1))}
                className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors flex items-center justify-center cursor-pointer"
                title="Zoom Out"
              >
                <FiMinus size={20} />
              </button>
            </div>

            {/* Image Container with Drag constraints */}
            <div className="relative w-full h-full flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
              <motion.img
                src={profileData?.profileImage || dp}
                alt={profileData?.userName}
                drag={zoomScale > 1}
                dragConstraints={{ left: -100 * zoomScale, right: 100 * zoomScale, top: -100 * zoomScale, bottom: 100 * zoomScale }}
                style={{ scale: zoomScale }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="max-h-[80vh] max-w-full object-contain cursor-grab active:cursor-grabbing rounded-lg shadow-2xl"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Layout>
  )
}

export default Profile
