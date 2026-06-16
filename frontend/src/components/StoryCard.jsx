import React, { useEffect, useRef, useState } from 'react'
import dp from "../assets/dp.webp"
import { useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { MdOutlineKeyboardBackspace } from 'react-icons/md'
import VideoPlayer from './VideoPlayer'
import { FaEye } from 'react-icons/fa6'
import { Avatar } from './ui/UIComponents'

// HINGLISH: StoryCard — full screen immersive story viewer
function StoryCard({ storyData }) {
  const { userData } = useSelector(state => state.user)
  const [showViewers, setShowViewers] = useState(false)
  const navigate = useNavigate()
  const [progress, setProgress] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const intervalRef = useRef(null)

  // HINGLISH: Progress bar — 15 seconds mein poori story
  useEffect(() => {
    if (!isPaused) {
      intervalRef.current = setInterval(() => {
        setProgress(prev => {
          if (prev >= 100) {
            clearInterval(intervalRef.current)
            navigate("/")
            return 100
          }
          return prev + 0.67 // ~15 seconds
        })
      }, 100)
    } else {
      clearInterval(intervalRef.current)
    }
    return () => clearInterval(intervalRef.current)
  }, [navigate, isPaused])

  const isOwnStory = storyData?.author?.userName === userData?.userName

  return (
    <div className="w-full h-screen relative overflow-hidden flex items-center justify-center"
      style={{ background: '#000' }}>

      {/* HINGLISH: Story media — image ya video */}
      <div className="w-full h-full absolute inset-0"
        onPointerDown={() => setIsPaused(true)}
        onPointerUp={() => setIsPaused(false)}
        onPointerLeave={() => setIsPaused(false)}>
        {storyData?.mediaType === "image" && (
          <img src={storyData?.media} alt="" className="w-full h-full object-cover" />
        )}
        {storyData?.mediaType === "video" && (
          <video src={storyData?.media} autoPlay loop muted={false} className="w-full h-full object-cover" />
        )}

        {/* HINGLISH: Dark gradient overlays — top and bottom */}
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.6) 0%, transparent 30%, transparent 60%, rgba(0,0,0,0.7) 100%)' }} />
      </div>

      {/* HINGLISH: Top bar — progress + author info */}
      <div className="absolute top-0 left-0 right-0 z-10 px-4 pt-safe-top pt-4">
        {/* HINGLISH: Progress bar */}
        <div className="w-full h-[3px] rounded-full mb-4" style={{ background: 'rgba(255,255,255,0.3)' }}>
          <div className="h-full rounded-full transition-none"
            style={{
              width: `${progress}%`,
              background: 'white',
              boxShadow: '0 0 8px rgba(255,255,255,0.8)'
            }} />
        </div>

        {/* HINGLISH: Author info row */}
        <div className="flex items-center gap-3">
          <button className="text-white hover:opacity-70" onClick={() => navigate('/')}>
            <MdOutlineKeyboardBackspace size={22} />
          </button>
          <div className="story-ring-active">
            <div className="w-9 h-9 rounded-full overflow-hidden" style={{ background: '#000' }}>
              <Avatar src={storyData?.author?.profileImage || dp} alt="" size="w-full h-full" className="w-full h-full hover:scale-100" />
            </div>
          </div>
          <div>
            <div className="text-white font-semibold text-sm">{storyData?.author?.userName}</div>
            <div className="text-xs" style={{ color: 'rgba(255,255,255,0.7)' }}>Just now</div>
          </div>
          {isPaused && (
            <div className="ml-auto px-2 py-0.5 rounded text-xs text-white"
              style={{ background: 'rgba(255,255,255,0.2)' }}>Paused</div>
          )}
        </div>
      </div>

      {/* HINGLISH: Viewers panel — sirf apni story mein dikhega */}
      {isOwnStory && !showViewers && (
        <div className="absolute bottom-8 left-0 right-0 z-10 px-4">
          <button
            className="flex items-center gap-3 cursor-pointer"
            onClick={() => setShowViewers(true)}>
            <div className="flex items-center gap-1.5 px-3 py-2 rounded-full"
              style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(10px)' }}>
              <FaEye className="text-white" size={14} />
              <span className="text-white text-sm font-semibold">{storyData?.viewers?.length || 0} viewers</span>
            </div>
            {/* HINGLISH: Viewer avatars preview */}
            <div className="flex">
              {storyData?.viewers?.slice(0, 3).map((viewer, i) => (
                <div key={i} className="w-7 h-7 rounded-full overflow-hidden border-2 border-black"
                  style={{ marginLeft: i > 0 ? '-8px' : '0' }}>
                  <Avatar src={viewer?.profileImage || dp} alt="" size="w-full h-full" className="w-full h-full hover:scale-100" />
                </div>
              ))}
            </div>
          </button>
        </div>
      )}

      {/* HINGLISH: Viewers slide-up sheet */}
      {showViewers && (
        <div className="absolute bottom-0 left-0 right-0 z-20 rounded-t-3xl slide-up"
          style={{ background: 'rgba(13,17,23,0.95)', backdropFilter: 'blur(30px)', maxHeight: '60%' }}>
          <div className="w-10 h-1 rounded-full mx-auto mt-3 mb-4" style={{ background: 'rgba(255,255,255,0.2)' }} />

          <div className="flex items-center justify-between px-4 mb-3">
            <div className="flex items-center gap-2">
              <FaEye className="text-white" size={16} />
              <span className="text-white font-semibold">{storyData?.viewers?.length || 0} Viewers</span>
            </div>
            <button className="text-gray-400 hover:text-white" onClick={() => setShowViewers(false)}>✕</button>
          </div>

          <div className="overflow-y-auto px-4 pb-6" style={{ maxHeight: 'calc(60vh - 80px)' }}>
            {storyData?.viewers?.map((viewer, index) => (
              <div key={index} className="flex items-center gap-3 py-3 border-b"
                style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                <div className="w-10 h-10 rounded-full overflow-hidden">
                  <Avatar src={viewer?.profileImage || dp} alt="" size="w-full h-full" className="w-full h-full hover:scale-100" />
                </div>
                <span className="text-white text-sm font-medium">{viewer?.userName}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default StoryCard
