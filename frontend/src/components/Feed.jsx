import React, { useCallback, useEffect, useRef, useState } from 'react'
import StoryDp from './StoryDp'
import Nav from './Nav'
import { useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import Post from './Post'

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
  const { userData, notificationData } = useSelector(state => state.user)
  const { storyList, currentUserStory } = useSelector(state => state.story)
  const navigate = useNavigate()

  const [visibleCount, setVisibleCount] = useState(5)
  const [loading, setLoading] = useState(!postData)
  const observerRef = useRef(null)
  const loadMoreRef = useRef(null)

  const unreadCount = notificationData?.filter(n => !n.isRead).length || 0
  const visiblePosts = postData?.slice(0, visibleCount) || []
  const hasMore = postData && visibleCount < postData.length

  useEffect(() => {
    if (postData) setLoading(false)
  }, [postData])

  const loadMore = useCallback(() => {
    if (hasMore) {
      setVisibleCount(prev => Math.min(prev + 5, postData.length))
    }
  }, [hasMore, postData?.length])

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
      className="min-h-screen lg:ml-[240px] xl:mr-[320px]"
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
      <div className="w-full max-w-[620px] mx-auto">
        {/* Stories */}
        <div className="px-4 py-4 border-b" style={{ borderColor: '#262626' }}>
          <div className="flex gap-4 overflow-x-auto pb-1 scroll-smooth">
            <StoryDp userName="Your Story" ProfileImage={userData?.profileImage} story={currentUserStory} />
            {storyList?.map((story) => (
              <StoryDp
                key={story._id}
                userName={story.author.userName}
                ProfileImage={story.author.profileImage}
                story={story}
              />
            ))}
          </div>
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
            <div className="flex flex-col items-center justify-center py-20 gap-4 px-8">
              <div className="w-16 h-16 rounded-full flex items-center justify-center connectly-gradient-bg opacity-20">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#8B5CF6" strokeWidth="1.5">
                  <rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" />
                  <polyline points="21 15 16 10 5 21" />
                </svg>
              </div>
              <p className="text-white font-semibold">Welcome to CONNECTLY</p>
              <p className="text-sm text-center" style={{ color: '#A8A8A8' }}>
                Follow people to see their posts in your feed
              </p>
              <button
                onClick={() => navigate('/search')}
                className="px-6 py-2.5 rounded-lg text-sm font-semibold text-white connectly-gradient-bg hover:opacity-90 transition-opacity"
              >
                Find People
              </button>
            </div>
          )}
        </div>
      </div>

      <Nav />
    </main>
  )
}

export default Feed
