import React from 'react'
import logo from '../assets/logo.png'
import StoryDp from './StoryDp'
import Nav from './Nav'
import { useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import Post from './Post'
import { FiBell } from 'react-icons/fi'
import { BiMessageAltDetail } from 'react-icons/bi'

// HINGLISH: Feed component — home page ka main content area (stories + posts)
function Feed() {
  const { postData } = useSelector(state => state.post)
  const { userData, notificationData } = useSelector(state => state.user)
  const { storyList, currentUserStory } = useSelector(state => state.story)
  const navigate = useNavigate()

  const unreadCount = notificationData?.filter(n => !n.isRead).length || 0

  return (
    // HINGLISH: Feed container — dark bg, full height, scrollable
    <div className="w-full lg:w-[calc(100%-260px)] lg:ml-[260px] min-h-screen"
      style={{ background: '#0D1117' }}>

      {/* HINGLISH: Mobile header — logo + notification + message icons */}
      <div className="lg:hidden w-full flex items-center justify-between px-5 py-4 sticky top-0 z-40"
        style={{ background: 'rgba(13,17,23,0.9)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        {/* HINGLISH: CONNECTLY logo text */}
        <h1 className="text-xl font-black gradient-text">CONNECTLY</h1>
        <div className="flex items-center gap-4">
          {/* HINGLISH: Notification bell with unread badge */}
          <div className="relative cursor-pointer" onClick={() => navigate("/notifications")}>
            <FiBell className="text-white w-[22px] h-[22px]" />
            {unreadCount > 0 && (
              <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold text-white"
                style={{ background: 'linear-gradient(135deg, #7C3AED, #EC4899)' }}>
                {unreadCount > 9 ? '9+' : unreadCount}
              </div>
            )}
          </div>
          <BiMessageAltDetail className="text-white w-[22px] h-[22px] cursor-pointer" onClick={() => navigate("/messages")} />
        </div>
      </div>

      {/* HINGLISH: Desktop header — CONNECTLY ka naam dikhao */}
      <div className="hidden lg:flex items-center justify-between px-6 py-5 sticky top-0 z-40"
        style={{ background: 'rgba(13,17,23,0.9)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div>
          <h1 className="text-lg font-bold text-white">Home Feed</h1>
          <p className="text-xs" style={{ color: '#6B7280' }}>What's happening in your world</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full cursor-pointer"
          style={{ background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.2)' }}>
          <span className="text-xs font-medium" style={{ color: '#7C3AED' }}>✨ AI Recommended</span>
        </div>
      </div>

      {/* HINGLISH: Stories row — horizontal scroll */}
      <div className="w-full px-4 py-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
        <div className="flex gap-4 overflow-x-auto pb-1">
          <StoryDp userName={"Your Story"} ProfileImage={userData?.profileImage} story={currentUserStory} />
          {storyList?.map((story, index) => (
            <StoryDp key={index} userName={story.author.userName} ProfileImage={story.author.profileImage} story={story} />
          ))}
        </div>
      </div>

      {/* HINGLISH: Posts feed — all posts from following users */}
      <div className="flex flex-col gap-4 px-4 py-4 pb-24 lg:pb-6 max-w-[680px] mx-auto">
        <Nav />
        {postData && postData.map((post, index) => (
          <Post post={post} key={index} />
        ))}

        {/* HINGLISH: Empty state — agar koi post nahi hai */}
        {postData?.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-16 h-16 rounded-full flex items-center justify-center"
              style={{ background: 'rgba(124,58,237,0.1)' }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#7C3AED" strokeWidth="1.5">
                <rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21 15 16 10 5 21" />
              </svg>
            </div>
            <p className="text-white font-semibold">No posts yet</p>
            <p className="text-sm text-center" style={{ color: '#6B7280' }}>Follow people to see their posts here</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default Feed
