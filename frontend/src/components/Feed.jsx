import React, { useCallback, useEffect, useRef, useState } from 'react'
import { useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import Post from './Post'
import { StoriesContainer, StoryViewer } from './stories/StoryViewer'
import axiosInstance from '../lib/axiosInstance'
import { FiImage, FiVideo, FiCode, FiSliders } from 'react-icons/fi'
import dp from "../assets/dp.webp"

function PostSkeleton() {
  return (
    <div className="w-full rounded-none overflow-hidden animate-pulse" style={{ background: '#121212', border: '1px solid #262626' }}>
      <div className="flex items-center gap-3 px-4 py-3">
        <div className="w-10 h-10 rounded-full shimmer" />
        <div className="flex-1">
          <div className="h-3 w-24 rounded shimmer mb-2" />
          <div className="h-2 w-16 rounded shimmer" />
        </div>
      </div>
      <div className="w-full aspect-square shimmer" />
      <div className="px-4 py-3 flex gap-4">
        <div className="h-6 w-6 rounded shimmer" />
        <div className="h-6 w-6 rounded shimmer" />
        <div className="h-6 w-6 rounded shimmer" />
      </div>
    </div>
  )
}

function Feed() {
  const { postData } = useSelector(state => state.post)
  const { userData, notificationData, following } = useSelector(state => state.user)
  const { storyList, currentUserStory } = useSelector(state => state.story)
  const navigate = useNavigate()

  const [selectedFilter, setSelectedFilter] = useState("all")
  const [visibleCount, setVisibleCount] = useState(5)
  const [loading, setLoading] = useState(!postData)
  const observerRef = useRef(null)
  const loadMoreRef = useRef(null)

  const [ownStories, setOwnStories] = useState([])
  const [activeStoryIndex, setActiveStoryIndex] = useState(null)
  const [storyGroups, setStoryGroups] = useState([])

  const fetchOwnStories = useCallback(async () => {
    if (!userData) return
    try {
      const res = await axiosInstance.get(`/api/story/getByUserName/${userData.userName}`)
      setOwnStories(res.data)
    } catch (err) {
      console.error("Failed to fetch own stories:", err)
    }
  }, [userData])

  useEffect(() => {
    fetchOwnStories()
  }, [fetchOwnStories, storyList])

  const unreadCount = notificationData?.filter(n => !n.isRead).length || 0

  // Filter posts based on selected tab
  const filteredPosts = postData?.filter(post => {
    const authorId = (post.author?._id || post.author)?.toString()
    if (selectedFilter === "following") {
      return following?.some(id => id?.toString() === authorId)
    }
    return true // "all"
  }) || []

  const visiblePosts = filteredPosts.slice(0, visibleCount)
  const hasMore = visibleCount < filteredPosts.length

  useEffect(() => {
    if (postData) setLoading(false)
  }, [postData])

  const trackedPostsRef = useRef(new Set())

  useEffect(() => {
    if (visiblePosts.length > 0) {
      const newPostIds = visiblePosts
        .map(p => p._id)
        .filter(id => id && !trackedPostsRef.current.has(id.toString()))
      
      if (newPostIds.length > 0) {
        newPostIds.forEach(id => trackedPostsRef.current.add(id.toString()))
        axiosInstance.post("/api/post/track/impression", { postIds: newPostIds }).catch(err => {
          console.error("Impression tracking error:", err)
        })
      }
    }
  }, [visiblePosts])

  const loadMore = useCallback(() => {
    if (hasMore) {
      setVisibleCount(prev => Math.min(prev + 5, filteredPosts.length))
    }
  }, [hasMore, filteredPosts.length])

  useEffect(() => {
    if (!loadMoreRef.current) return
    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) loadMore()
      },
      { threshold: 0.1 }
    )
    observerRef.current.observe(loadMoreRef.current)
    return () => observerRef.current?.disconnect()
  }, [loadMore])

  return (
    <main
      className="min-h-screen w-full"
      style={{ background: '#000000' }}
    >
      {/* Mobile header */}
      <div
        className="lg:hidden sticky top-0 z-40 flex items-center justify-between px-4 py-3"
        style={{ background: '#000000', borderBottom: '1px solid #262626' }}
      >
        <h1 className="text-xl font-black connectly-gradient-text">CONNECTLY</h1>
        <div className="flex items-center gap-5">
          <button className="relative" onClick={() => navigate('/notifications')}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-[9px] font-bold text-white flex items-center justify-center connectly-badge">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
          <button onClick={() => navigate('/messages')}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Center feed — max 620px */}
      <div className="w-full max-w-[620px] mx-auto px-4 py-6">
        {/* Create Post Bar */}
        {userData && (
          <div className="w-full bg-[#0E1118] border border-[#262626] rounded-2xl p-4 mb-5 flex items-center justify-between gap-3 shadow-xl">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="relative flex-shrink-0">
                <div className="w-10 h-10 rounded-full overflow-hidden border border-[#262626]">
                  <img src={userData.profileImage || dp} alt="" className="w-full h-full object-cover" />
                </div>
                <div className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border border-black bg-green-500 shadow-[0_0_6px_rgba(34,197,94,0.8)]" />
              </div>
              <button 
                onClick={() => navigate('/upload?type=post')}
                className="flex-1 bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] text-left text-xs md:text-sm text-gray-400 py-2.5 px-4 rounded-xl transition-all outline-none truncate"
              >
                What's on your mind, {userData.name?.split(' ')[0]}?
              </button>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              <button
                onClick={() => navigate('/upload?type=post')}
                className="p-2 hover:bg-white/5 rounded-xl text-gray-400 hover:text-[#8B5CF6] transition-all"
                title="Upload Photo/Media"
              >
                <FiImage size={18} />
              </button>
              <button
                onClick={() => navigate('/upload?type=loop')}
                className="p-2 hover:bg-white/5 rounded-xl text-gray-400 hover:text-[#EC4899] transition-all"
                title="Upload Video"
              >
                <FiVideo size={18} />
              </button>
              <button
                onClick={() => navigate('/upload?type=post&code=true')}
                className="p-2 hover:bg-white/5 rounded-xl text-gray-400 hover:text-[#A855F7] transition-all"
                title="Share Code Snippet"
              >
                <FiCode size={18} />
              </button>
            </div>
          </div>
        )}

        {/* Stories */}
        <div className="mb-5">
          <StoriesContainer
            stories={storyList}
            ownStories={ownStories}
            onStoryClick={(idx, groups) => {
              setStoryGroups(groups)
              setActiveStoryIndex(idx)
            }}
            onAddOwnClick={() => navigate('/upload')}
          />
        </div>

        {/* Story Viewer Modal */}
        <AnimatePresence>
          {activeStoryIndex !== null && (
            <StoryViewer
              groupedStories={storyGroups}
              initialUserIndex={activeStoryIndex}
              onClose={() => setActiveStoryIndex(null)}
            />
          )}
        </AnimatePresence>

        {/* Feed Filters */}
        <div className="flex items-center justify-between py-2 px-1 mb-4">
          <div className="flex gap-2 p-1 rounded-xl bg-[#0E1118] border border-[#262626]">
            {[
              { id: 'all', label: 'All Posts' },
              { id: 'following', label: 'Following' }
            ].map(filter => (
              <button
                key={filter.id}
                onClick={() => {
                  setSelectedFilter(filter.id)
                  setVisibleCount(5) // Reset pagination
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  selectedFilter === filter.id 
                    ? "bg-gradient-to-r from-[#8B5CF6] to-[#A855F7] text-white shadow-[0_0_12px_rgba(139,92,246,0.3)]"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
          <button 
            onClick={() => navigate('/search')}
            className="p-2 hover:bg-white/5 rounded-lg text-gray-400 hover:text-white transition-all animate-pulse"
            title="Discover more"
          >
            <FiSliders size={16} />
          </button>
        </div>

        {/* Posts */}
        <div className="flex flex-col pb-24 lg:pb-8">
          {loading ? (
            <>
              <PostSkeleton />
              <PostSkeleton />
            </>
          ) : visiblePosts.length > 0 ? (
            <>
              {visiblePosts.map((post) => (
                <Post post={post} key={post._id} />
              ))}
              {hasMore && (
                <div ref={loadMoreRef} className="py-4">
                  <PostSkeleton />
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 gap-4 px-8 bg-[#0E1118] border border-[#262626] rounded-2xl">
              <div className="w-16 h-16 rounded-full flex items-center justify-center bg-[#8B5CF6]/10 opacity-80">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#8B5CF6" strokeWidth="1.5">
                  <rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" />
                  <polyline points="21 15 16 10 5 21" />
                </svg>
              </div>
              <p className="text-white font-semibold">No posts to display</p>
              <p className="text-xs text-center text-gray-400 max-w-xs">
                {selectedFilter === "all" 
                  ? "Welcome to Connectly! No posts are currently available." 
                  : `There are no posts from users in your ${selectedFilter} filter yet.`}
              </p>
              <button
                onClick={() => navigate('/search')}
                className="px-6 py-2 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-[#8B5CF6] to-[#A855F7] hover:opacity-90 transition-opacity"
              >
                Find People
              </button>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}

export default Feed
