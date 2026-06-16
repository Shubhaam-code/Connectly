import React, { useEffect, useRef, useState } from 'react'
import dp from "../assets/dp.webp"
import VideoPlayer from './VideoPlayer'
import { useDispatch, useSelector } from 'react-redux'
import { setPostData } from '../redux/postSlice'
import { setUserData } from '../redux/userSlice'
import FollowButton from './FollowButton'
import { useNavigate } from 'react-router-dom'
import axiosInstance from '../lib/axiosInstance'
import { useSocket } from '../context/SocketContext'
import ShareModal from './share/ShareModal'
import CommentsSection from './comments/CommentsSection'
import { Avatar } from './ui/UIComponents'

// HINGLISH: Post card component — Premium Instagram-style card layout
function Post({ post }) {
  const { userData } = useSelector(state => state.user)
  const { postData } = useSelector(state => state.post)
  const socket = useSocket()
  const [showComment, setShowComment] = useState(false)
  const [isShareOpen, setIsShareOpen] = useState(false)
  const [showHeartAnim, setShowHeartAnim] = useState(false)
  const navigate = useNavigate()
  const dispatch = useDispatch()

  const postDataRef = useRef(postData)
  useEffect(() => { postDataRef.current = postData }, [postData])

  const isLiked = post.likes.some(id => id.toString() === userData._id.toString())
  const isSaved = userData?.saved?.some(id => (id?._id || id)?.toString() === post?._id?.toString()) || false

  // Optimistic like — update UI instantly
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

  const handleDoubleClick = () => {
    setShowHeartAnim(true)
    setTimeout(() => setShowHeartAnim(false), 1500)
    if (!isLiked) handleLike()
  }

  const handleSaved = async () => {
    try {
      const result = await axiosInstance.get(`/api/post/saved/${post._id}`)
      dispatch(setUserData(result.data))
    } catch (error) {
      console.error("handleSaved error:", error.message)
    }
  }

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

  const renderCaptionWithCodeBlocks = (caption) => {
    if (!caption) return null;
    const parts = caption.split(/(```[\s\S]*?```)/g);
    return parts.map((part, index) => {
      if (part.startsWith("```") && part.endsWith("```")) {
        const lines = part.slice(3, -3).trim().split("\n");
        let lang = "";
        let codeLines = lines;
        if (lines[0] && /^[a-zA-Z0-9_-]+$/.test(lines[0])) {
          lang = lines[0];
          codeLines = lines.slice(1);
        }
        const codeText = codeLines.join("\n");
        return (
          <div key={index} className="my-3 bg-[var(--background-secondary)] border border-[var(--border)] rounded-xl overflow-hidden font-mono text-xs text-[var(--text-primary)] shadow-inner" onClick={(e) => e.stopPropagation()}>
            <div className="bg-[var(--card)] px-4 py-2 border-b border-[var(--border)] flex justify-between items-center text-[10px] uppercase font-bold text-[var(--text-secondary)] tracking-wider">
              <span>{lang || "code"}</span>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  navigator.clipboard.writeText(codeText);
                }}
                className="hover:text-[var(--text-primary)] transition-colors cursor-pointer"
              >
                Copy
              </button>
            </div>
            <pre className="p-4 overflow-x-auto select-text leading-relaxed text-[var(--text-primary)]">
              <code>{codeText}</code>
            </pre>
          </div>
        );
      }
      return <span key={index} className="whitespace-pre-line text-[var(--text-primary)]">{part}</span>;
    });
  };

  return (
    <div className="w-full bg-[var(--card)] border border-[var(--border)] rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.03)] overflow-hidden fade-in mb-6">
      
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-[var(--border)]">
        <div 
          className="flex items-center gap-3 cursor-pointer"
          onClick={() => navigate(`/profile/${post.author?.userName}`)}
        >
          {/* Avatar with ring */}
          <div className="story-ring-active flex-shrink-0">
            <div className="w-9 h-9 rounded-full overflow-hidden p-0.5 bg-[var(--card)]">
              <Avatar 
                src={post.author?.profileImage || dp} 
                alt="" 
                size="w-full h-full"
                className="w-full h-full hover:scale-100" 
              />
            </div>
          </div>
          <div>
            <div className="text-sm font-bold text-[var(--text)] hover:underline leading-tight">
              {post.author?.userName}
            </div>
            <div className="text-[10px] text-[var(--text-secondary)] font-medium">
              {post.author?.profession || "CONNECTLY Creator"}
            </div>
          </div>
        </div>

        {userData._id?.toString() !== post.author._id?.toString() && (
          <FollowButton
            tailwind="px-4 py-1.5 rounded-full text-xs font-semibold btn-gradient cursor-pointer"
            targetUserId={post.author._id}
          />
        )}
      </div>

      {/* Media container */}
      <div className="relative w-full aspect-auto overflow-hidden bg-black flex items-center justify-center max-h-[550px]" onDoubleClick={handleDoubleClick}>
        {post.mediaType === "image" && (
          <img src={post.media} alt="" className="w-full h-full object-contain max-h-[550px]" />
        )}
        {post.mediaType === "video" && (
          <div className="w-full">
            <VideoPlayer media={post.media} />
          </div>
        )}

        {/* Double-tap heart animation overlay */}
        {showHeartAnim && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10 bg-black/10">
            <div className="heart-animation">
              <svg width="80" height="80" viewBox="0 0 24 24" fill="#EC4899" filter="drop-shadow(0 0 20px rgba(236,72,153,0.8))">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
            </div>
          </div>
        )}
      </div>

      {/* Action buttons row */}
      <div className="flex items-center justify-between px-4 py-3 bg-[var(--card)]">
        <div className="flex items-center gap-4">
          
          {/* Like button */}
          <button 
            className="flex items-center gap-1.5 cursor-pointer text-[var(--text-secondary)] hover:text-rose-500 transition-colors" 
            onClick={handleLike}
          >
            {isLiked ? (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="#EC4899">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
            ) : (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="stroke-[2]">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
            )}
            <span className="text-xs font-bold" style={{ color: isLiked ? '#EC4899' : 'inherit' }}>
              {post.likes.length}
            </span>
          </button>

          {/* Comment button */}
          <button 
            className="flex items-center gap-1.5 cursor-pointer text-[var(--text-secondary)] hover:text-[var(--text)] transition-colors" 
            onClick={() => setShowComment(prev => !prev)}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="stroke-[2]">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            <span className="text-xs font-bold">{post.comments.length}</span>
          </button>

          {/* Share button */}
          <button 
            className="cursor-pointer text-[var(--text-secondary)] hover:text-[var(--text)] transition-colors" 
            onClick={() => setIsShareOpen(true)}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="stroke-[2]">
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        </div>

        {/* Save button */}
        <button 
          className="cursor-pointer text-[var(--text-secondary)] hover:text-amber-500 transition-colors" 
          onClick={handleSaved}
        >
          {isSaved ? (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="#7C3AED">
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
            </svg>
          ) : (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="stroke-[2]">
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
            </svg>
          )}
        </button>
      </div>

      {/* Caption */}
      {post.caption && (
        <div className="px-4 pb-4 pt-1 bg-[var(--card)] border-t border-[var(--border)] border-dashed">
          <div className="flex items-baseline gap-2">
            <span 
              className="font-bold text-[var(--text)] cursor-pointer hover:underline text-xs" 
              onClick={() => navigate(`/profile/${post.author?.userName}`)}
            >
              {post.author?.userName}
            </span>
            <div className="text-[var(--text-secondary)] text-xs flex-1 leading-relaxed">
              {renderCaptionWithCodeBlocks(post.caption)}
            </div>
          </div>
        </div>
      )}

      {/* Comment section — show/hide toggle */}
      {showComment && (
        <div className="border-t border-[var(--border)] px-4 py-3 bg-[var(--background-secondary)] max-h-[350px] overflow-y-auto">
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
