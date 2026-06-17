import React, { useCallback, useEffect, useRef, useState } from 'react'
import { useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import Post from './Post'
import { StoriesContainer, StoryViewer } from './stories/StoryViewer'
import axiosInstance from '../lib/axiosInstance'
import { FiImage, FiVideo, FiCode, FiSliders } from 'react-icons/fi'
import dp from "../assets/dp.webp"
import NewsCarousel from './news/NewsCarousel'

function PostSkeleton() {
  return (
    <div className="w-full rounded-2xl overflow-hidden animate-pulse bg-[var(--card)] border border-[var(--border)] mb-6">
      <div className="flex items-center gap-3 px-4 py-3">
        <div className="w-10 h-10 rounded-full shimmer bg-[var(--border)]" />
        <div className="flex-1">
          <div className="h-3 w-24 rounded shimmer bg-[var(--border)] mb-2" />
          <div className="h-2 w-16 rounded shimmer bg-[var(--border)]" />
        </div>
      </div>
      <div className="w-full aspect-square shimmer bg-[var(--border)]" />
      <div className="px-4 py-3 flex gap-4">
        <div className="h-6 w-6 rounded shimmer bg-[var(--border)]" />
        <div className="h-6 w-6 rounded shimmer bg-[var(--border)]" />
        <div className="h-6 w-6 rounded shimmer bg-[var(--border)]" />
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
      className="min-h-screen w-full bg-[var(--background)] text-[var(--text)]"
    >
      {/* Mobile header */}
      <div
        className="lg:hidden sticky top-0 z-40 flex items-center justify-between px-4 py-2.5 bg-[var(--background)] border-b border-[var(--border)] text-[var(--text)] animate-fade-in"
      >
        <div className="flex items-center cursor-pointer" onClick={() => navigate('/')}>
          <img
            src="/favicon.png"
            alt="Connectly Logo"
            className="w-10 h-10 object-contain dark:invert transition-transform duration-300 active:scale-95"
          />
        </div>
        <div className="flex items-center gap-5">
          <button className="relative" onClick={() => navigate('/notifications')}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-[9px] font-bold text-white flex items-center justify-center connectly-badge">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
          <button onClick={() => navigate('/messages')}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Center feed — max 620px */}
      <div className="w-full max-w-[620px] mx-auto px-4 py-6">
        {/* Create Post Bar */}
        {userData && (
          <div className="w-full bg-[var(--card)]/75 backdrop-blur-2xl border border-[var(--border)] rounded-[24px] p-5 mb-6 shadow-xl flex flex-col gap-4 select-none">
            {/* Input Row */}
            <div className="flex items-center gap-3.5 w-full">
              <div className="relative flex-shrink-0">
                <div className="w-10 h-10 rounded-full p-[2px] bg-gradient-to-tr from-[#8B5CF6] via-[#EC4899] to-[#3B82F6]">
                  <div className="w-full h-full rounded-full overflow-hidden border border-[var(--card)] bg-[#0B1220]">
                    <img src={userData.profileImage || dp} alt="" className="w-full h-full object-cover" />
                  </div>
                </div>
                <div className="absolute bottom-0 right-0 w-3 h-3 rounded-full border-[1.5px] border-[var(--card)] bg-green-500 shadow-[0_0_8px_#22c55e]" />
              </div>
              <button 
                onClick={() => navigate('/upload?type=post')}
                className="flex-1 bg-[var(--background-secondary)]/60 hover:bg-white/5 border border-[var(--border)] text-left text-xs md:text-sm text-[var(--text-secondary)] hover:text-white py-3 px-5 rounded-xl transition-all duration-300 outline-none truncate cursor-pointer shadow-inner"
              >
                What's on your mind, {userData.name?.split(' ')[0]}?
              </button>
            </div>

            {/* Separator line */}
            <div className="h-[1px] w-full bg-[var(--border)]" />

            {/* Quick Actions Row */}
            <div className="flex items-center justify-start gap-3 flex-wrap w-full px-1">
              <button
                onClick={() => navigate('/upload?type=post')}
                className="flex items-center gap-2 px-4 py-2 hover:bg-[#3B82F6]/10 border border-white/5 hover:border-[#3B82F6]/20 rounded-xl text-[var(--text-secondary)] hover:text-[#3B82F6] transition-all duration-300 cursor-pointer text-xs font-bold"
                title="Upload Photo/Media"
              >
                <FiImage size={16} className="text-[#3B82F6]" />
                <span>Image</span>
              </button>
              
              <button
                onClick={() => navigate('/upload?type=loop')}
                className="flex items-center gap-2 px-4 py-2 hover:bg-[#EC4899]/10 border border-white/5 hover:border-[#EC4899]/20 rounded-xl text-[var(--text-secondary)] hover:text-[#EC4899] transition-all duration-300 cursor-pointer text-xs font-bold"
                title="Upload Video"
              >
                <FiVideo size={16} className="text-[#EC4899]" />
                <span>Video</span>
              </button>

              <button
                onClick={() => navigate('/upload?type=post&code=true')}
                className="flex items-center gap-2 px-4 py-2 hover:bg-[#A855F7]/10 border border-white/5 hover:border-[#A855F7]/20 rounded-xl text-[var(--text-secondary)] hover:text-[#A855F7] transition-all duration-300 cursor-pointer text-xs font-bold"
                title="Share Code Snippet"
              >
                <FiCode size={16} className="text-[#A855F7]" />
                <span>Code</span>
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

        {/* Trending News Carousel */}
        <NewsCarousel />

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
          <div className="flex gap-2 p-1 rounded-xl bg-[var(--card)] border border-[var(--border)]">
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
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  selectedFilter === filter.id 
                    ? "bg-gradient-to-r from-[#8B5CF6] to-[#A855F7] text-white shadow-[0_0_12px_rgba(139,92,246,0.3)]"
                    : "text-[var(--text-secondary)] hover:text-[var(--text)]"
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
          <button 
            onClick={() => navigate('/search')}
            className="p-2 hover:bg-[var(--hover)] rounded-lg text-[var(--text-secondary)] hover:text-[var(--text)] transition-all animate-pulse cursor-pointer"
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
            <div className="flex flex-col items-center justify-center py-20 gap-4 px-8 bg-[var(--card)] border border-[var(--border)] rounded-2xl">
              <div className="w-16 h-16 rounded-full flex items-center justify-center bg-[#8B5CF6]/10 opacity-80">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#8B5CF6" strokeWidth="1.5">
                  <rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" />
                  <polyline points="21 15 16 10 5 21" />
                </svg>
              </div>
              <p className="text-[var(--text)] font-semibold">No posts to display</p>
              <p className="text-xs text-center text-[var(--text-secondary)] max-w-xs">
                {selectedFilter === "all" 
                  ? "Welcome to Connectly! No posts are currently available." 
                  : `There are no posts from users in your ${selectedFilter} filter yet.`}
              </p>
              <button
                onClick={() => navigate('/search')}
                className="px-6 py-2 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-[#8B5CF6] to-[#A855F7] hover:opacity-90 transition-opacity cursor-pointer"
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
