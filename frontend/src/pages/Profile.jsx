import axiosInstance from '../lib/axiosInstance'
import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { setProfileData, setUserData } from '../redux/userSlice'
import { MdOutlineKeyboardBackspace } from 'react-icons/md'
import { FiSettings } from 'react-icons/fi'
import dp from "../assets/dp.webp"
import Nav from '../components/Nav'
import FollowButton from '../components/FollowButton'
import Post from '../components/Post'
import { setSelectedUser } from '../redux/messageSlice'

// HINGLISH: Profile page — user ka premium profile screen with grid + stats
// FIX: Switched from raw axios to axiosInstance for auto auth-refresh
function Profile() {
  const { userName } = useParams()
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const [postType, setPostType] = useState("posts")
  const [profileLoading, setProfileLoading] = useState(true)
  const { profileData, userData } = useSelector(state => state.user)
  const { postData } = useSelector(state => state.post)
  const isOwnProfile = profileData?._id === userData?._id

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
    } catch (error) {
      console.error("logout error:", error.message)
      // Still clear local state even if server call fails
      dispatch(setUserData(null))
    }
  }

  useEffect(() => { handleProfile() }, [userName, dispatch])

  // HINGLISH: User ki posts filter karna
  const userPosts = postData?.filter(post => post.author?._id === profileData?._id) || []
  // FIX: Safe check userData.saved — may be null/undefined before loaded
  const savedPosts = postData?.filter(post => userData?.saved?.includes(post._id)) || []
  const displayPosts = isOwnProfile
    ? (postType === "posts" ? userPosts : savedPosts)
    : userPosts

  if (profileLoading && !profileData) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center" style={{ background: '#0D1117' }}>
        <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="w-full min-h-screen pb-24 lg:pb-0" style={{ background: '#0D1117' }}>

      {/* HINGLISH: Header bar with back + username + settings */}
      <div className="sticky top-0 z-40 flex items-center justify-between px-4 py-3"
        style={{ background: 'rgba(13,17,23,0.95)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <button className="text-gray-400 hover:text-white transition-colors"
          onClick={() => navigate('/')}>
          <MdOutlineKeyboardBackspace size={22} />
        </button>
        <h1 className="text-base font-bold text-white">{profileData?.userName}</h1>
        <button className="text-gray-400 hover:text-white transition-colors"
          onClick={() => isOwnProfile ? navigate('/settings') : null}>
          <FiSettings size={20} />
        </button>
      </div>

      {/* HINGLISH: Profile hero section — cover gradient + avatar */}
      <div className="relative">
        {/* HINGLISH: Cover gradient background */}
        <div className="w-full h-[140px]"
          style={{ background: 'linear-gradient(135deg, #1a0d2e 0%, #0d1730 50%, #0D1117 100%)' }} />

        {/* HINGLISH: Avatar — overlapping the cover */}
        <div className="px-5 pb-4">
          <div className="flex items-end justify-between -mt-[50px] mb-4">
            <div className="story-ring-active">
              <div className="w-[90px] h-[90px] rounded-full overflow-hidden" style={{ background: '#0D1117' }}>
                <img src={profileData?.profileImage || dp} alt="" className="w-full h-full object-cover" />
              </div>
            </div>

            {/* HINGLISH: Action buttons — Edit Profile / Follow + Message */}
            <div className="flex gap-2 mt-4">
              {isOwnProfile ? (
                <>
                  <button
                    className="px-5 py-2 rounded-xl text-sm font-semibold text-white hover-scale transition-all"
                    style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)' }}
                    onClick={() => navigate('/editprofile')}>
                    Edit Profile
                  </button>
                  <button
                    className="px-4 py-2 rounded-xl text-sm font-semibold text-white hover-scale"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                    onClick={handleLogOut}>
                    Log Out
                  </button>
                </>
              ) : (
                <>
                  <FollowButton
                    tailwind="px-5 py-2 rounded-xl text-sm font-semibold btn-gradient hover-scale"
                    targetUserId={profileData?._id}
                    onFollowChange={handleProfile}
                  />
                  <button
                    className="px-4 py-2 rounded-xl text-sm font-semibold text-white hover-scale"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                    onClick={() => {
                      dispatch(setSelectedUser(profileData))
                      navigate('/messageArea')
                    }}>
                    Message
                  </button>
                </>
              )}
            </div>
          </div>

          {/* HINGLISH: User info — name, profession, bio */}
          <div className="mb-5">
            <h2 className="text-lg font-bold text-white">{profileData?.name}</h2>
            <p className="text-sm font-medium" style={{ color: '#7C3AED' }}>
              {profileData?.profession || "CONNECTLY Creator"}
            </p>
            {profileData?.bio && (
              <p className="text-sm mt-1.5 leading-relaxed" style={{ color: '#D1D5DB' }}>{profileData?.bio}</p>
            )}
          </div>

          {/* HINGLISH: Stats row — Posts, Followers, Following */}
          <div className="flex gap-0 rounded-2xl overflow-hidden"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
            {[
              { label: 'Posts', value: profileData?.posts?.length || 0 },
              { label: 'Followers', value: profileData?.followers?.length || 0 },
              { label: 'Following', value: profileData?.following?.length || 0 },
            ].map((stat, i) => (
              <div key={stat.label}
                className="flex-1 flex flex-col items-center py-3 cursor-pointer hover:bg-white/5 transition-all"
                style={{ borderLeft: i > 0 ? '1px solid rgba(255,255,255,0.06)' : 'none' }}>
                <span className="text-xl font-bold gradient-text">{stat.value}</span>
                <span className="text-xs mt-0.5" style={{ color: '#9CA3AF' }}>{stat.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* HINGLISH: Posts/Saved tab bar — sirf apni profile mein */}
      {isOwnProfile && (
        <div className="flex border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          {[
            { key: 'posts', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /></svg> },
            { key: 'saved', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" /></svg> },
          ].map(tab => (
            <button key={tab.key}
              className="flex-1 flex items-center justify-center py-3 transition-all"
              style={{ color: postType === tab.key ? '#7C3AED' : '#6B7280', borderBottom: postType === tab.key ? '2px solid #7C3AED' : '2px solid transparent' }}
              onClick={() => setPostType(tab.key)}>
              {tab.icon}
            </button>
          ))}
        </div>
      )}

      {/* HINGLISH: Posts photo grid — 3 columns */}
      {displayPosts.length > 0 ? (
        <div className="grid grid-cols-3 gap-0.5 mt-0.5">
          {displayPosts.map((post, index) => (
            post.mediaType === "image" ? (
              <div key={index} className="aspect-square overflow-hidden cursor-pointer hover-scale">
                <img src={post.media} alt="" className="w-full h-full object-cover" />
              </div>
            ) : (
              <div key={index} className="aspect-square overflow-hidden relative cursor-pointer hover-scale">
                <video src={post.media} muted className="w-full h-full object-cover" />
                {/* HINGLISH: Video indicator */}
                <div className="absolute top-2 right-2">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="white">
                    <polygon points="23 7 16 12 23 17 23 7" /><rect x="1" y="5" width="15" height="14" rx="2" ry="2" fill="white" />
                  </svg>
                </div>
              </div>
            )
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3 py-16 px-8">
          <div className="w-16 h-16 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.2)' }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#7C3AED" strokeWidth="1.5">
              <rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
          </div>
          <p className="text-white font-semibold">No posts yet</p>
          {isOwnProfile && (
            <button className="px-6 py-2.5 rounded-full btn-gradient text-sm font-semibold text-white"
              onClick={() => navigate('/upload')}>
              Create your first post
            </button>
          )}
        </div>
      )}

      <Nav />
    </div>
  )
}

export default Profile
