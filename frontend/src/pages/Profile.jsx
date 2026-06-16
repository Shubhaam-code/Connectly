import axiosInstance from '../lib/axiosInstance'
import React, { useEffect, useState, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { setProfileData, setUserData } from '../redux/userSlice'
import { setPostData } from '../redux/postSlice'
import { FiSettings, FiGrid, FiVideo, FiBookmark, FiHeart, FiMessageCircle, FiLogOut, FiArrowLeft, FiSearch, FiX, FiBarChart2, FiPlus, FiMinus, FiRotateCcw } from 'react-icons/fi'
import dp from "../assets/dp.webp"
import Layout from '../components/layout/Layout'
import FollowButton from '../components/FollowButton'
import PostModal from '../components/posts/PostModal'
import { setSelectedUser } from '../redux/messageSlice'
import { motion, AnimatePresence } from 'framer-motion'
import { StoryViewer } from '../components/stories/StoryViewer'

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
    displayPosts = userPosts
  } else if (postType === "loops") {
    displayPosts = userLoops
  } else if (postType === "saved") {
    displayPosts = filteredSavedPosts
  }

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

  if (profileLoading && !profileData) {
    return (
      <Layout>
        <div className="w-full h-full flex items-center justify-center bg-[#000000]">
          <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </Layout>
    )
  }

  const currentModalPost = selectedPostIndex !== null ? displayPosts[selectedPostIndex] : null

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 py-8 bg-[#000000] text-white min-h-screen">
        
        {/* Mobile Sticky / Top header */}
        <div className="flex items-center justify-between border-b border-[#262626] pb-4 mb-8 md:hidden">
          <button className="text-[#A8A8A8] hover:text-white" onClick={() => navigate('/')}>
            <FiArrowLeft size={22} />
          </button>
          <span className="font-bold text-sm tracking-wide">{profileData?.userName}</span>
          <button className="text-[#A8A8A8] hover:text-white" onClick={() => isOwnProfile ? navigate('/settings') : null}>
            <FiSettings size={20} />
          </button>
        </div>

        {/* Profile Info Row */}
        <div className="flex flex-col md:flex-row items-center md:items-start gap-8 md:gap-16 mb-12">
          {/* Avatar Section */}
          <div className="relative flex-shrink-0 cursor-pointer animate-fade-in" onClick={() => setShowAvatarOptions(true)}>
            <div className={`w-24 h-24 md:w-36 md:h-36 rounded-full flex items-center justify-center transition-all duration-300 ${
              profileStories.length > 0
                ? "p-[3px] bg-gradient-to-tr from-yellow-500 via-pink-500 to-purple-600 animate-pulse hover:scale-105"
                : "p-[1px] border border-[#262626] hover:border-purple-500"
            }`}>
              <div className="w-full h-full rounded-full overflow-hidden border-4 border-black bg-[#121212]">
                <img
                  src={profileData?.profileImage || dp}
                  alt={profileData?.userName}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
            {profileData?.isOnline && (
              <span className="absolute bottom-1 right-1 md:bottom-3 md:right-3 w-4.5 h-4.5 bg-green-500 border-4 border-black rounded-full" />
            )}
          </div>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            className="hidden"
          />

          {/* User Details Section */}
          <div className="flex-1 text-center md:text-left space-y-4 md:space-y-6">
            {/* Username & Buttons */}
            <div className="flex flex-col md:flex-row md:items-center gap-4">
              <div className="flex items-center justify-center md:justify-start gap-2">
                <h1 className="text-xl font-light tracking-wide">{profileData?.userName}</h1>
                {profileData?.isVerified && (
                  <svg viewBox="0 0 24 24" className="w-4.5 h-4.5 fill-blue-500 inline-block align-middle ml-1" title="Verified Creator">
                    <path d="M12.003 21.602c-5.305 0-9.602-4.298-9.602-9.602s4.298-9.602 9.602-9.602c5.305 0 9.602 4.298 9.602 9.602s-4.298 9.602-9.602 9.602zm-1.802-5.402l6.602-6.601-1.401-1.401-5.201 5.2-2.201-2.201-1.4 1.401 3.601 3.602z"/>
                  </svg>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex justify-center md:justify-start gap-2">
                {isOwnProfile ? (
                  <>
                    <button
                      onClick={() => navigate('/editprofile')}
                      className="px-4 py-1.5 bg-[#121212] border border-[#262626] rounded-lg text-sm font-semibold text-white hover:bg-[#1a1a1a] transition-all"
                    >
                      Edit Profile
                    </button>
                    <button
                      onClick={handleLogOut}
                      className="px-3 py-1.5 bg-[#121212] border border-red-900/30 rounded-lg text-sm font-semibold text-red-500 hover:bg-red-950/20 transition-all flex items-center gap-1"
                    >
                      <FiLogOut size={14} /> Log Out
                    </button>
                  </>
                ) : (
                  <>
                    <FollowButton
                      targetUserId={profileData?._id}
                      onFollowChange={handleProfile}
                      tailwind="px-6 py-1.5 rounded-lg text-sm font-semibold btn-gradient hover-scale"
                    />
                    <button
                      onClick={() => {
                        dispatch(setSelectedUser(profileData))
                        navigate('/messages')
                      }}
                      className="px-4 py-1.5 bg-[#121212] border border-[#262626] rounded-lg text-sm font-semibold text-white hover:bg-[#1a1a1a] transition-all"
                    >
                      Message
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Stats Row */}
            <div className="flex justify-center md:justify-start gap-10 text-sm border-t border-b border-[#121212] py-3 md:border-0 md:py-0">
              <div onClick={() => setPostType("posts")} className="cursor-pointer hover:opacity-80 transition-opacity">
                <span className="font-bold text-white mr-1">{profileData?.posts?.length || 0}</span>
                <span className="text-gray-400">posts</span>
              </div>
              <div onClick={() => openFollowModal("followers")} className="cursor-pointer hover:opacity-80 transition-opacity">
                <span className="font-bold text-white mr-1">{profileData?.followers?.length || 0}</span>
                <span className="text-gray-400">followers</span>
              </div>
              <div onClick={() => openFollowModal("following")} className="cursor-pointer hover:opacity-80 transition-opacity">
                <span className="font-bold text-white mr-1">{profileData?.following?.length || 0}</span>
                <span className="text-gray-400">following</span>
              </div>
            </div>

            {/* Name & Bio */}
            <div className="space-y-1">
              <h2 className="font-semibold text-sm text-white">{profileData?.name}</h2>
              <span className="text-xs font-semibold text-purple-400 block">
                {profileData?.profession || "CONNECTLY Creator"}
              </span>
              {profileData?.bio && (
                <p className="text-sm text-gray-300 font-normal leading-relaxed whitespace-pre-wrap max-w-lg mx-auto md:mx-0">
                  {profileData?.bio}
                </p>
              )}
              {(() => {
                const mutuals = !isOwnProfile && profileData?.followers && userData?.following
                  ? profileData.followers.filter(follower => 
                      userData.following.some(followingUser => 
                        (followingUser._id || followingUser).toString() === (follower._id || follower).toString()
                      )
                    )
                  : [];

                if (mutuals.length === 0) return null;

                return (
                  <p className="text-xs text-gray-400 pt-1">
                    Followed by{" "}
                    {mutuals.slice(0, 2).map((u, i) => (
                      <span 
                        key={u._id} 
                        className="font-semibold text-white hover:underline cursor-pointer"
                        onClick={() => navigate(`/profile/${u.userName}`)}
                      >
                        {u.userName}{i < Math.min(mutuals.length, 2) - 1 ? ", " : ""}
                      </span>
                    ))}
                    {mutuals.length > 2 && ` + ${mutuals.length - 2} more mutuals`}
                  </p>
                );
              })()}
            </div>
          </div>
        </div>

        {/* Tab Row (Instagram Style top border) */}
        <div className="flex justify-center border-t border-[#262626]">
          <div className="flex gap-8 md:gap-12">
            <button
              onClick={() => setPostType("posts")}
              className={`flex items-center gap-1.5 py-4 text-xs tracking-widest font-semibold border-t-2 transition-all ${
                postType === "posts"
                  ? "border-white text-white"
                  : "border-transparent text-gray-500 hover:text-white"
              }`}
            >
              <FiGrid size={12} />
              POSTS
            </button>
            <button
              onClick={() => setPostType("loops")}
              className={`flex items-center gap-1.5 py-4 text-xs tracking-widest font-semibold border-t-2 transition-all ${
                postType === "loops"
                  ? "border-white text-white"
                  : "border-transparent text-gray-500 hover:text-white"
              }`}
            >
              <FiVideo size={12} />
              LOOPS
            </button>
            {isOwnProfile && (
              <>
                <button
                  onClick={() => setPostType("saved")}
                  className={`flex items-center gap-1.5 py-4 text-xs tracking-widest font-semibold border-t-2 transition-all ${
                    postType === "saved"
                      ? "border-white text-white"
                      : "border-transparent text-gray-500 hover:text-white"
                  }`}
                >
                  <FiBookmark size={12} />
                  SAVED
                </button>
                <button
                  onClick={() => setPostType("analytics")}
                  className={`flex items-center gap-1.5 py-4 text-xs tracking-widest font-semibold border-t-2 transition-all ${
                    postType === "analytics"
                      ? "border-white text-white"
                      : "border-transparent text-gray-500 hover:text-white"
                  }`}
                >
                  <FiBarChart2 size={12} />
                  ANALYTICS
                </button>
              </>
            )}
          </div>
        </div>

        {/* 3-Column Posts Media Grid or Analytics View */}
        {postType === "analytics" && isOwnProfile ? (
          <div className="space-y-6 mt-4 animate-fade-in">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[#262626] pb-4">
              <div>
                <h3 className="text-lg font-bold text-white">Creator Analytics</h3>
                <p className="text-xs text-gray-400">Monitor your audience reach and content engagement</p>
              </div>
              {/* Period Toggle Capsules */}
              <div className="flex bg-[#121212] border border-[#262626] p-1 rounded-xl">
                {["today", "7days", "30days"].map((p) => (
                  <button
                    key={p}
                    onClick={() => setAnalyticsPeriod(p)}
                    className={`px-3.5 py-1.5 rounded-lg text-[10px] md:text-xs font-semibold uppercase tracking-wider transition-all ${
                      analyticsPeriod === p
                        ? "bg-purple-600 text-white shadow-md shadow-purple-600/20"
                        : "text-gray-400 hover:text-white"
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
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {[
                  { label: "Profile Views", value: analyticsData?.profileViews, desc: "Users who visited your profile" },
                  { label: "Post Impressions", value: analyticsData?.impressions, desc: "Times your posts were seen" },
                  { label: "Audience Reach", value: analyticsData?.reach, desc: "Unique users who saw your content" },
                  { label: "Total Likes", value: analyticsData?.likes, desc: "Likes received on your posts" },
                  { label: "Total Comments", value: analyticsData?.comments, desc: "Comments left on your posts" },
                  { label: "Total Shares", value: analyticsData?.shares, desc: "Times your posts were shared" }
                ].map((card, idx) => (
                  <div key={idx} className="bg-[#121212] border border-[#262626] rounded-2xl p-5 hover:border-purple-500/40 transition-all group flex flex-col justify-between min-h-[140px]">
                    <div>
                      <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">{card.label}</p>
                      <p className="text-[10px] text-gray-500 mt-1 leading-snug">{card.desc}</p>
                    </div>
                    <p className="text-3xl font-bold mt-4 bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent group-hover:scale-105 transition-transform origin-left">
                      {card.value || 0}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : savedLoading && postType === "saved" ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500"></div>
          </div>
        ) : displayPosts.length > 0 ? (
          <div className="grid grid-cols-3 gap-1 md:gap-2 mt-4 animate-fade-in">
            {displayPosts.map((post, index) => {
              const isVideo = post.mediaType === "video" || postType === "loops"
              return (
                <div
                  key={post._id || index}
                  onClick={() => {
                    setSelectedPostIndex(index)
                    setIsModalOpen(true)
                  }}
                  className="aspect-square bg-[#121212] overflow-hidden relative group cursor-pointer border border-[#1a1a1a] rounded-sm"
                >
                  {isVideo ? (
                    <video
                      src={post.media}
                      className="w-full h-full object-cover"
                      muted
                      loop
                      playsInline
                      onMouseEnter={(e) => e.target.play().catch(() => {})}
                      onMouseLeave={(e) => e.target.pause()}
                    />
                  ) : (
                    <img
                      src={post.media}
                      alt="post"
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                    />
                  )}

                  {/* Play icon overlay for videos */}
                  {isVideo && (
                    <div className="absolute top-2 right-2 text-white/80 group-hover:opacity-0 transition-opacity z-10">
                      <FiVideo size={14} className="drop-shadow-md" />
                    </div>
                  )}

                  {/* Hover Overlay with Likes & Comments Count */}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-6 text-white font-bold z-20">
                    <span className="flex items-center gap-1.5">
                      <FiHeart className="fill-white stroke-none" size={18} />
                      {post.likes?.length || 0}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <FiMessageCircle className="fill-white stroke-none" size={18} />
                      {post.comments?.length || 0}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
            <div className="w-16 h-16 rounded-full border border-[#262626] flex items-center justify-center text-gray-500">
              {postType === "posts" ? <FiGrid size={24} /> : postType === "loops" ? <FiVideo size={24} /> : <FiBookmark size={24} />}
            </div>
            <h3 className="font-semibold text-lg">
              No {postType === "posts" ? "Posts" : postType === "loops" ? "Loops" : "Saved Posts"} Yet
            </h3>
            {isOwnProfile && postType === "posts" && (
              <button
                onClick={() => navigate('/upload')}
                className="px-6 py-2 bg-blue-500 rounded-lg text-sm font-semibold text-white hover:bg-blue-600 transition-all"
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
              className="bg-[#121212] border border-[#262626] rounded-2xl w-full max-w-sm overflow-hidden flex flex-col max-h-[80vh]"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="px-5 py-4 border-b border-[#262626] flex items-center justify-between flex-shrink-0">
                <span className="text-sm font-bold capitalize text-white">
                  {followModalType === "followers" ? "Followers" : "Following"}
                </span>
                <button 
                  onClick={() => setShowFollowModal(false)}
                  className="text-gray-400 hover:text-white"
                >
                  <FiX size={18} />
                </button>
              </div>

              {/* Search Bar */}
              <div className="p-4 border-b border-[#1c1c1c] flex-shrink-0">
                <div className="flex items-center gap-2.5 px-3 py-2 bg-[#1c1c1c] rounded-xl text-xs text-gray-500 border border-transparent focus-within:border-[#333]">
                  <FiSearch size={14} />
                  <input
                    type="text"
                    placeholder="Search..."
                    value={followSearch}
                    onChange={(e) => setFollowSearch(e.target.value)}
                    className="w-full text-xs text-white bg-transparent outline-none placeholder:text-gray-600"
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
                      <p className="text-center text-xs text-gray-500 py-10">
                        No creators found
                      </p>
                    );
                  }

                  return filteredList.map((user) => {
                    const isMutual = userData?.following?.some(id => (id._id || id).toString() === user._id.toString()) && 
                                     userData?.followers?.some(id => (id._id || id).toString() === user._id.toString());
                    return (
                      <div key={user._id} className="flex items-center justify-between gap-3">
                        <div 
                          className="flex items-center gap-3 cursor-pointer flex-1 min-w-0"
                          onClick={() => {
                            setShowFollowModal(false)
                            navigate(`/profile/${user.userName}`)
                          }}
                        >
                          <img 
                            src={user.profileImage || dp} 
                            alt="" 
                            className="w-10 h-10 rounded-full object-cover bg-neutral-900 flex-shrink-0"
                          />
                          <div className="truncate">
                            <div className="flex items-center gap-1.5">
                              <p className="text-xs font-semibold text-white truncate">{user.userName}</p>
                              {isMutual && (
                                <span className="px-1.5 py-0.5 rounded text-[8px] bg-purple-950/40 text-purple-400 font-bold tracking-wide border border-purple-900/30">
                                  Mutual
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-gray-500 truncate">{user.name}</p>
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
              className="bg-[#121212] border border-[#262626] rounded-2xl w-full max-w-xs overflow-hidden flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="px-5 py-4 border-b border-[#262626] text-center">
                <span className="text-sm font-bold text-white">Profile Photo Options</span>
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
                    className="py-3.5 border-b border-[#262626] text-purple-400 font-bold hover:bg-white/5 transition-all"
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
                  className="py-3.5 border-b border-[#262626] text-white hover:bg-white/5 transition-all"
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
                      className="py-3.5 border-b border-[#262626] text-blue-400 hover:bg-white/5 transition-all font-semibold"
                    >
                      Change Profile Photo
                    </button>
                    {profileData?.profileImage && (
                      <button
                        onClick={() => {
                          setShowAvatarOptions(false)
                          handleRemovePhoto()
                        }}
                        className="py-3.5 text-red-500 hover:bg-white/5 transition-all font-semibold"
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
                className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors"
              >
                <FiX size={20} />
              </button>
            </div>

            {/* Scale buttons at the bottom */}
            <div className="absolute bottom-6 flex gap-4 z-[1000]" onClick={(e) => e.stopPropagation()}>
              <button
                onClick={() => setZoomScale(prev => Math.min(prev + 0.2, 4))}
                className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors flex items-center justify-center"
                title="Zoom In"
              >
                <FiPlus size={20} />
              </button>
              <button
                onClick={() => setZoomScale(1)}
                className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors flex items-center justify-center"
                title="Reset Zoom"
              >
                <FiRotateCcw size={20} />
              </button>
              <button
                onClick={() => setZoomScale(prev => Math.max(prev - 0.2, 1))}
                className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors flex items-center justify-center"
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
