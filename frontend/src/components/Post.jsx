import React, { useEffect, useRef, useState } from 'react'
import dp from "../assets/dp.webp"
import VideoPlayer from './VideoPlayer'
import { useDispatch, useSelector } from 'react-redux'
import { setPostData } from '../redux/postSlice'
import { setUserData } from '../redux/userSlice'
import FollowButton from './FollowButton'
import { useNavigate } from 'react-router-dom'
import axiosInstance from '../lib/axiosInstance'
import { IoSendSharp } from "react-icons/io5"
import { useSocket } from '../context/SocketContext'
import ShareModal from './share/ShareModal'
import CommentsSection from './comments/CommentsSection'

// HINGLISH: Post card component — dark glassmorphism style with gradient actions
// FIX: Switched from raw axios to axiosInstance for auto auth-refresh
function Post({ post }) {
  const { userData } = useSelector(state => state.user)
  const { postData } = useSelector(state => state.post)
  // BUG FIX (Issue 4): Read socket from Context, not Redux
  const socket = useSocket()
  const [showComment, setShowComment] = useState(false)
  const [isShareOpen, setIsShareOpen] = useState(false)
  // Removed basic message state since CommentSection manages it
  const [showHeartAnim, setShowHeartAnim] = useState(false)
  const navigate = useNavigate()
  const dispatch = useDispatch()

  // FIX: Use ref to avoid stale closure in socket handler
  const postDataRef = useRef(postData)
  useEffect(() => { postDataRef.current = postData }, [postData])

  // FIX: Safe check with toString() for ObjectId comparison
  const isLiked = post.likes.some(id => id.toString() === userData._id.toString())
  const isSaved = userData?.saved?.some(id => (id?._id || id)?.toString() === post?._id?.toString()) || false

  // Optimistic like — update UI instantly, revert on failure
  const handleLike = async () => {
    const wasLiked = isLiked
    const optimisticLikes = wasLiked
      ? post.likes.filter(id => id.toString() !== userData._id.toString())
      : [...post.likes, userData._id]

    const optimisticPosts = postDataRef.current.map(p =>
      p._id === post._id ? { ...p, likes: optimisticLikes } : p
    )
    dispatch(setPostData(optimisticPosts))

    try {
      const result = await axiosInstance.get(`/api/post/like/${post._id}`)
      const updatedPosts = postDataRef.current.map(p => p._id === post._id ? result.data : p)
      dispatch(setPostData(updatedPosts))
    } catch (error) {
      dispatch(setPostData(postDataRef.current.map(p =>
        p._id === post._id ? { ...p, likes: post.likes } : p
      )))
      console.error("handleLike error:", error.message)
    }
  }

  // HINGLISH: Double tap pe heart animation + like
  const handleDoubleClick = () => {
    setShowHeartAnim(true)
    setTimeout(() => setShowHeartAnim(false), 1500)
    if (!isLiked) handleLike()
  }

  // Removed basic handleComment since CommentsSection encapsulates it

  // HINGLISH: Post save/unsave karna
  const handleSaved = async () => {
    try {
      const result = await axiosInstance.get(`/api/post/saved/${post._id}`)
      dispatch(setUserData(result.data))
    } catch (error) {
      console.error("handleSaved error:", error.message)
    }
  }

  // HINGLISH: Real-time socket events — doosre users ke like/comment receive karna
  // FIX: Removed postData from dependency array — use ref to avoid stale closure
  // Previously: [socketRef?.current, postData] caused socket.off/on on every like/comment,
  // creating O(n²) event listeners and causing missed events.
  useEffect(() => {
    if (!socket) return
    const handleLikedPost = (updatedData) => {
      const updatedPosts = postDataRef.current.map(p => p._id === updatedData.postId ? { ...p, likes: updatedData.likes } : p)
      dispatch(setPostData(updatedPosts))
    }
    const handleCommentedPost = (updatedData) => {
      const updatedPosts = postDataRef.current.map(p => p._id === updatedData.postId ? { ...p, comments: updatedData.comments } : p)
      dispatch(setPostData(updatedPosts))
    }
    socket.on("likedPost", handleLikedPost)
    socket.on("commentedPost", handleCommentedPost)
    return () => {
      socket.off("likedPost", handleLikedPost)
      socket.off("commentedPost", handleCommentedPost)
    }
  }, [socket, dispatch])

  return (
    // HINGLISH: Post card — dark glassmorphism style
    <div className="w-full overflow-hidden fade-in mb-4"
      style={{ background: '#121212', borderBottom: '1px solid #262626' }}>

      {/* HINGLISH: Post header — author info + follow button */}
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3 cursor-pointer"
          onClick={() => navigate(`/profile/${post.author?.userName}`)}>
          {/* HINGLISH: Author avatar with gradient ring */}
          <div className="story-ring-active">
            <div className="w-10 h-10 rounded-full overflow-hidden" style={{ background: '#0D1117' }}>
              <img src={post.author?.profileImage || dp} alt="" className="w-full h-full object-cover" />
            </div>
          </div>
          <div>
            <div className="text-sm font-semibold text-white">{post.author?.userName}</div>
            <div className="text-xs" style={{ color: '#6B7280' }}>
              {post.author?.profession || "CONNECTLY user"}
            </div>
          </div>
        </div>

        {userData._id?.toString() !== post.author._id?.toString() && (
          <FollowButton
            tailwind="px-4 py-1.5 rounded-full text-xs font-semibold btn-gradient"
            targetUserId={post.author._id}
          />
        )}
      </div>

      {/* HINGLISH: Post media — image ya video */}
      <div className="relative w-full" onDoubleClick={handleDoubleClick}>
        {post.mediaType === "image" && (
          <img src={post.media} alt="" className="w-full object-cover max-h-[500px]" />
        )}
        {post.mediaType === "video" && (
          <div className="w-full">
            <VideoPlayer media={post.media} />
          </div>
        )}

        {/* HINGLISH: Double-tap heart animation overlay */}
        {showHeartAnim && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="heart-animation">
              <svg width="80" height="80" viewBox="0 0 24 24" fill="#EC4899" filter="drop-shadow(0 0 20px rgba(236,72,153,0.8))">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
            </div>
          </div>
        )}
      </div>

      {/* HINGLISH: Post caption */}
      {post.caption && (
        <div className="px-4 pt-3 pb-1">
          <span className="text-sm font-semibold text-white">{post.author?.userName} </span>
          <span className="text-sm" style={{ color: '#D1D5DB' }}>{post.caption}</span>
        </div>
      )}

      {/* HINGLISH: Action buttons row — like, comment, share, save */}
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-5">
          {/* HINGLISH: Like button with count */}
          <button className="flex items-center gap-1.5 like-btn" onClick={handleLike}>
            {isLiked ? (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="#EC4899">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
            ) : (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
            )}
            <span className="text-sm" style={{ color: isLiked ? '#EC4899' : '#9CA3AF' }}>{post.likes.length}</span>
          </button>

          {/* HINGLISH: Comment button */}
          <button className="flex items-center gap-1.5 hover-scale" onClick={() => setShowComment(prev => !prev)}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            <span className="text-sm" style={{ color: '#9CA3AF' }}>{post.comments.length}</span>
          </button>

          {/* HINGLISH: Share button */}
          <button className="hover-scale" onClick={() => setIsShareOpen(true)}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2">
              <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        </div>

        {/* HINGLISH: Save button — right side mein */}
        <button className="hover-scale" onClick={handleSaved}>
          {isSaved ? (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="#7C3AED">
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
            </svg>
          ) : (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2">
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
            </svg>
          )}
        </button>
      </div>

      {/* Comment section — show/hide toggle */}
      {showComment && (
        <div className="border-t px-4 py-3 bg-[#121212] max-h-[350px] overflow-y-auto" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          <CommentsSection postId={post._id} comments={post.comments} />
        </div>
      )}
      {isShareOpen && (
        <ShareModal
          isOpen={isShareOpen}
          onClose={() => setIsShareOpen(false)}
          item={post}
          itemType="post"
        />
      )}
    </div>
  )
}

export default Post
