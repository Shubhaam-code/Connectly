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
    <div className="w-full bg-[var(--card)]/90 backdrop-blur-lg border border-[var(--border)] rounded-[28px] shadow-[0_12px_40px_rgba(0,0,0,0.03)] dark:shadow-[0_12px_40px_rgba(0,0,0,0.2)] overflow-hidden fade-in mb-6 hover:shadow-2xl hover:border-purple-500/10 transition-all duration-300 select-none">
      
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)]">
        <div 
          className="flex items-center gap-3.5 cursor-pointer"
          onClick={() => navigate(`/profile/${post.author?.userName}`)}
        >
          {/* Avatar with ring */}
          <div className="w-10 h-10 rounded-full p-[2px] bg-gradient-to-tr from-[#8B5CF6] via-[#EC4899] to-[#A855F7] flex-shrink-0 animate-pulse-slow">
            <div className="w-full h-full rounded-full overflow-hidden bg-[#0B1220] p-[1px]">
              <Avatar 
                src={post.author?.profileImage || dp} 
                alt="" 
                size="w-full h-full"
                className="w-full h-full object-cover rounded-full" 
              />
            </div>
          </div>
          <div className="text-left">
            <div className="text-xs md:text-sm font-black text-[var(--text)] hover:text-[var(--primary)] transition-colors leading-tight flex items-center gap-1">
              {post.author?.userName}
              {post.author?.isVerified && (
                <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-blue-500 flex-shrink-0">
                  <path d="M12.003 21.602c-5.305 0-9.602-4.298-9.602-9.602s4.298-9.602 9.602-9.602c5.305 0 9.602 4.298 9.602 9.602s-4.298 9.602-9.602 9.602zm-1.802-5.402l6.602-6.601-1.401-1.401-5.201 5.2-2.201-2.201-1.4 1.401 3.601 3.602z" />
                </svg>
              )}
            </div>
            <div className="text-[9px] text-[var(--text-secondary)] font-semibold uppercase tracking-wider mt-0.5">
              {post.author?.profession || "CONNECTLY Creator"}
            </div>
          </div>
        </div>

        {userData._id?.toString() !== post.author._id?.toString() && (
          <FollowButton
            tailwind="px-4 py-1.5 rounded-xl text-xs font-bold btn-gradient cursor-pointer"
            targetUserId={post.author._id}
          />
        )}
      </div>

      {/* Media container */}
      <div className="relative w-full aspect-auto overflow-hidden bg-black flex items-center justify-center max-h-[550px] cursor-pointer" onDoubleClick={handleDoubleClick}>
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
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10 bg-black/30 backdrop-blur-[2px]">
            <div className="heart-animation">
              <svg width="100" height="100" viewBox="0 0 24 24" fill="#EC4899" filter="drop-shadow(0 0 25px rgba(236,72,153,0.95))">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
            </div>
          </div>
        )}
      </div>

      {/* Action buttons row */}
      <div className="flex items-center justify-between px-5 py-3.5 bg-[var(--card)]/95 border-b border-[var(--border)]">
        <div className="flex items-center gap-5">
          
          {/* Like button */}
          <button 
            className="flex items-center gap-1.5 cursor-pointer text-[var(--text-secondary)] hover:text-[#EC4899] transition-all duration-300 relative group/btn p-1 rounded-full hover:bg-[#EC4899]/5" 
            onClick={handleLike}
          >
            {isLiked ? (
              <svg width="21" height="21" viewBox="0 0 24 24" fill="#EC4899" className="filter drop-shadow-[0_0_6px_rgba(236,72,153,0.45)]">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
            ) : (
              <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="stroke-[2] transition-transform duration-300 group-hover/btn:scale-110">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
            )}
            <span className="text-xs font-black select-none" style={{ color: isLiked ? '#EC4899' : 'inherit' }}>
              {post.likes.length}
            </span>
          </button>

          {/* Comment button */}
          <button 
            className="flex items-center gap-1.5 cursor-pointer text-[var(--text-secondary)] hover:text-[#8B5CF6] transition-all duration-300 relative group/btn p-1 rounded-full hover:bg-[#8B5CF6]/5" 
            onClick={() => setShowComment(prev => !prev)}
          >
            <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="stroke-[2] transition-transform duration-300 group-hover/btn:scale-110">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            <span className="text-xs font-black select-none">{post.comments.length}</span>
          </button>

          {/* Share button */}
          <button 
            className="cursor-pointer text-[var(--text-secondary)] hover:text-[#10B981] transition-all duration-300 p-1 rounded-full hover:bg-[#10B981]/5" 
            onClick={() => setIsShareOpen(true)}
          >
            <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="stroke-[2] hover:scale-110 transition-transform">
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        </div>

        {/* Save button */}
        <button 
          className="cursor-pointer text-[var(--text-secondary)] hover:text-amber-500 transition-all duration-300 p-1.5 rounded-full hover:bg-amber-500/5" 
          onClick={handleSaved}
        >
          {isSaved ? (
            <svg width="21" height="21" viewBox="0 0 24 24" fill="#EAB308" className="filter drop-shadow-[0_0_6px_rgba(234,179,8,0.45)]">
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
            </svg>
          ) : (
            <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="stroke-[2] hover:scale-110 transition-transform">
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
