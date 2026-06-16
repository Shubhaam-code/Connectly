import React, { useEffect, useRef, useState } from 'react'
import { FiVolume2, FiVolumeX } from "react-icons/fi"
import dp from "../assets/dp.webp"
import FollowButton from './FollowButton'
import { useDispatch, useSelector } from 'react-redux'
import { setLoopData } from '../redux/loopSlice'
import axiosInstance from '../lib/axiosInstance'
import { IoSendSharp } from "react-icons/io5"
import { useNavigate } from 'react-router-dom'
import { useSocket } from '../context/SocketContext'
import ShareModal from './share/ShareModal'

// HINGLISH: LoopCard — TikTok-style full screen reel player with all actions
function LoopCard({ loop }) {
  const videoRef = useRef()
  const commentRef = useRef()
  const [isPlaying, setIsPlaying] = useState(true)
  const [isMute, setIsMute] = useState(false)
  const [progress, setProgress] = useState(0)
  const [showHeart, setShowHeart] = useState(false)
  const [showComment, setShowComment] = useState(false)
  const [isShareOpen, setIsShareOpen] = useState(false)
  const [message, setMessage] = useState("")
  const { userData } = useSelector(state => state.user)
  // BUG FIX (Issue 4): Read socket from Context, not Redux
  const socketRef = useSocket()
  const { loopData } = useSelector(state => state.loop)
  const dispatch = useDispatch()
  const navigate = useNavigate()

  // FIX: Use ref to avoid stale closure in socket handler
  const loopDataRef = useRef(loopData)
  useEffect(() => { loopDataRef.current = loopData }, [loopData])

  // FIX: Use .toString() for proper ObjectId comparison
  const isLiked = loop.likes?.some(id => id.toString() === userData._id.toString())

  // HINGLISH: Video progress track karna
  const handleTimeUpdate = () => {
    const video = videoRef.current
    if (video) {
      const percent = (video.currentTime / video.duration) * 100
      setProgress(percent)
    }
  }

  // HINGLISH: Double tap pe heart animation aur auto-like
  const handleDoubleClick = () => {
    setShowHeart(true)
    setTimeout(() => setShowHeart(false), 1500)
    if (!isLiked) handleLike()
  }

  const handleClick = () => {
    if (isPlaying) {
      videoRef.current?.pause()
      setIsPlaying(false)
    } else {
      videoRef.current?.play()
      setIsPlaying(true)
    }
  }

  // HINGLISH: Like/unlike loop API call
  const handleLike = async () => {
    try {
      const result = await axiosInstance.get(`/api/loop/like/${loop._id}`)
      const updatedLoops = loopDataRef.current.map(p => p._id === loop._id ? result.data : p)
      dispatch(setLoopData(updatedLoops))
    } catch (error) {
      console.error("handleLike error:", error.message)
    }
  }

  // HINGLISH: Comment add karna loop mein
  const handleComment = async () => {
    if (!message.trim()) return
    try {
      const result = await axiosInstance.post(`/api/loop/comment/${loop._id}`, { message })
      const updatedLoops = loopDataRef.current.map(p => p._id === loop._id ? result.data : p)
      dispatch(setLoopData(updatedLoops))
      setMessage("")
    } catch (error) {
      console.error("handleComment error:", error.message)
    }
  }

  // HINGLISH: Comment panel ke bahar click karne par band karna
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (commentRef.current && !commentRef.current.contains(event.target)) {
        setShowComment(false)
      }
    }
    if (showComment) document.addEventListener("mousedown", handleClickOutside)
    else document.removeEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [showComment])

  // HINGLISH: IntersectionObserver — screen pe aane par play, jane par pause
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      const video = videoRef.current
      if (!video) return
      if (entry.isIntersecting) {
        video.play()
        setIsPlaying(true)
      } else {
        video.pause()
        setIsPlaying(false)
      }
    }, { threshold: 0.6 })
    if (videoRef.current) observer.observe(videoRef.current)
    return () => { if (videoRef.current) observer.unobserve(videoRef.current) }
  }, [])

  // HINGLISH: Socket real-time updates — doosre users ke like/comment
  // FIX: Removed loopData from dependency array — use ref instead
  useEffect(() => {
    const socket = socketRef?.current
    if (!socket) return
    const handleLikedLoop = (updatedData) => {
      const updatedLoops = loopDataRef.current.map(p => p._id === updatedData.loopId ? { ...p, likes: updatedData.likes } : p)
      dispatch(setLoopData(updatedLoops))
    }
    const handleCommentedLoop = (updatedData) => {
      const updatedLoops = loopDataRef.current.map(p => p._id === updatedData.loopId ? { ...p, comments: updatedData.comments } : p)
      dispatch(setLoopData(updatedLoops))
    }
    socket.on("likedLoop", handleLikedLoop)
    socket.on("commentedLoop", handleCommentedLoop)
    return () => {
      socket.off("likedLoop", handleLikedLoop)
      socket.off("commentedLoop", handleCommentedLoop)
    }
  }, [socketRef?.current, dispatch])

  return (
    <div className="w-full h-screen flex items-center justify-center relative overflow-hidden"
      style={{ background: '#000' }}>

      {/* HINGLISH: Heart animation — double tap pe dikhta hai */}
      {showHeart && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 heart-animation z-50 pointer-events-none">
          <svg width="90" height="90" viewBox="0 0 24 24" fill="#EC4899"
            style={{ filter: 'drop-shadow(0 0 20px rgba(236,72,153,0.8))' }}>
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
        </div>
      )}

      {/* HINGLISH: Comments bottom sheet — slide up panel */}
      <div ref={commentRef}
        className={`absolute z-[200] bottom-0 w-full rounded-t-3xl transform transition-transform duration-500 ease-in-out`}
        style={{
          background: 'rgba(13,17,23,0.95)',
          backdropFilter: 'blur(30px)',
          border: '1px solid rgba(255,255,255,0.1)',
          height: '65%',
          transform: showComment ? 'translateY(0)' : 'translateY(100%)'
        }}>
        <div className="w-10 h-1 rounded-full mx-auto mt-3 mb-4" style={{ background: 'rgba(255,255,255,0.2)' }} />
        <h2 className="text-white text-base font-semibold text-center mb-4">
          Comments ({loop.comments?.length || 0})
        </h2>

        {/* HINGLISH: Comments list */}
        <div className="px-4 overflow-y-auto flex flex-col gap-3" style={{ height: 'calc(100% - 140px)' }}>
          {loop.comments?.length === 0 && (
            <p className="text-center py-8" style={{ color: '#6B7280' }}>No comments yet. Be the first!</p>
          )}
          {loop.comments?.map((com, index) => (
            <div key={index} className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0">
                <img src={com.author?.profileImage || dp} alt="" className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 px-3 py-2 rounded-2xl rounded-tl-sm text-sm"
                style={{ background: 'rgba(255,255,255,0.05)' }}>
                <span className="font-semibold text-white text-xs">{com.author?.userName} </span>
                <span style={{ color: '#D1D5DB' }}>{com.message}</span>
              </div>
            </div>
          ))}
        </div>

        {/* HINGLISH: Comment input at bottom of sheet */}
        <div className="absolute bottom-0 left-0 right-0 p-4"
          style={{ background: 'rgba(13,17,23,0.95)', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0">
              <img src={userData?.profileImage || dp} alt="" className="w-full h-full object-cover" />
            </div>
            <div className="flex-1 flex items-center gap-2 px-4 h-[40px] rounded-full"
              style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)' }}>
              <input
                type="text"
                placeholder="Send a chat..."
                className="w-full text-sm bg-transparent outline-none text-white placeholder:text-gray-600"
                onChange={(e) => setMessage(e.target.value)}
                value={message}
                onKeyDown={(e) => e.key === 'Enter' && handleComment()}
              />
              {message && (
                <button onClick={handleComment}>
                  <IoSendSharp className="text-purple-500 w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* HINGLISH: Main video element */}
      <video
        ref={videoRef}
        autoPlay
        muted={isMute}
        loop
        src={loop?.media}
        className="w-full h-full object-cover"
        onClick={handleClick}
        onTimeUpdate={handleTimeUpdate}
        onDoubleClick={handleDoubleClick}
      />

      {/* HINGLISH: Gradient overlay — bottom ke liye */}
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 40%, transparent 70%, rgba(0,0,0,0.3) 100%)' }} />

      {/* HINGLISH: Pause indicator */}
      {!isPlaying && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
          <div className="w-16 h-16 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(10px)' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
          </div>
        </div>
      )}

      {/* HINGLISH: Mute toggle — top right */}
      <button className="absolute top-16 right-4 z-10 w-9 h-9 rounded-full flex items-center justify-center"
        style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(10px)' }}
        onClick={() => setIsMute(prev => !prev)}>
        {isMute ? <FiVolumeX className="text-white" size={16} /> : <FiVolume2 className="text-white" size={16} />}
      </button>

      {/* HINGLISH: Author info + caption — bottom left */}
      <div className="absolute bottom-10 left-4 right-16 z-10">
        <div className="flex items-center gap-2 mb-2 cursor-pointer"
          onClick={() => navigate(`/profile/${loop.author?.userName}`)}>
          <div className="w-10 h-10 rounded-full overflow-hidden story-ring-active flex-shrink-0">
            <img src={loop.author?.profileImage || dp} alt="" className="w-full h-full object-cover" />
          </div>
          <span className="text-white font-semibold text-sm">{loop.author?.userName}</span>
          {userData._id !== loop.author?._id && (
            <FollowButton
              targetUserId={loop.author?._id}
              tailwind="px-3 py-1 text-white text-xs border border-white rounded-full font-semibold"
            />
          )}
        </div>
        {loop.caption && (
          <p className="text-white text-sm leading-relaxed" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.8)' }}>
            {loop.caption}
          </p>
        )}
      </div>

      {/* HINGLISH: Action buttons — right side vertical stack */}
      <div className="absolute right-4 bottom-20 z-10 flex flex-col items-center gap-5">
        {/* Like */}
        <button className="flex flex-col items-center gap-1 like-btn" onClick={handleLike}>
          {isLiked ? (
            <svg width="28" height="28" viewBox="0 0 24 24" fill="#EC4899"
              style={{ filter: 'drop-shadow(0 0 8px rgba(236,72,153,0.6))' }}>
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
          ) : (
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
          )}
          <span className="text-white text-xs font-semibold" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.8)' }}>
            {loop.likes?.length || 0}
          </span>
        </button>

        {/* Comment */}
        <button className="flex flex-col items-center gap-1 hover-scale" onClick={() => setShowComment(true)}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          <span className="text-white text-xs font-semibold" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.8)' }}>
            {loop.comments?.length || 0}
          </span>
        </button>

        {/* Share */}
        <button className="flex flex-col items-center gap-1 hover-scale" onClick={() => setIsShareOpen(true)}>
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
            <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
          </svg>
          <span className="text-white text-xs" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.8)' }}>Share</span>
        </button>
      </div>

      {/* HINGLISH: Progress bar at bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-1 z-10" style={{ background: 'rgba(255,255,255,0.2)' }}>
        <div className="h-full transition-all duration-200 ease-linear"
          style={{ width: `${progress}%`, background: 'linear-gradient(90deg, #7C3AED, #EC4899)' }} />
      </div>
      {isShareOpen && (
        <ShareModal
          isOpen={isShareOpen}
          onClose={() => setIsShareOpen(false)}
          item={loop}
          itemType="loop"
        />
      )}
    </div>
  )
}

export default LoopCard