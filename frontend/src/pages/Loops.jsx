import React from 'react'
import { useNavigate } from 'react-router-dom'
import { MdOutlineKeyboardBackspace } from 'react-icons/md'
import LoopCard from '../components/LoopCard'
import { useSelector } from 'react-redux'
import Nav from '../components/Nav'

// HINGLISH: Loops/Reels page — TikTok-style full screen video feed
function Loops() {
  const navigate = useNavigate()
  const { loopData } = useSelector(state => state.loop)

  return (
    <div className="w-screen h-screen overflow-hidden flex justify-center relative" style={{ background: '#000' }}>

      {/* HINGLISH: Top overlay — Following/For You tabs */}
      <div className="absolute top-0 left-0 right-0 z-[50] flex flex-col items-center pt-4 pb-2"
        style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.7), transparent)' }}>
        <div className="flex items-center gap-6">
          <button className="text-gray-400 text-sm font-medium hover:text-white transition-colors">Following</button>
          <div className="flex flex-col items-center">
            <span className="text-white text-sm font-bold">For You</span>
            <div className="w-6 h-0.5 rounded-full mt-0.5" style={{ background: 'linear-gradient(90deg, #7C3AED, #EC4899)' }} />
          </div>
        </div>

        {/* HINGLISH: Back arrow for mobile */}
        <button className="absolute left-4 top-4 text-white hover:opacity-70 transition-opacity"
          onClick={() => navigate('/')}>
          <MdOutlineKeyboardBackspace size={24} />
        </button>
      </div>

      {/* HINGLISH: Snap scroll container — TikTok jaisa scroll */}
      <div className="w-full max-w-[480px] h-full overflow-y-scroll snap-y snap-mandatory"
        style={{ scrollbarWidth: 'none' }}>
        {loopData && loopData.map((loop, index) => (
          <div key={index} className="h-screen snap-start">
            <LoopCard loop={loop} />
          </div>
        ))}

        {/* HINGLISH: Empty state — agar koi loop nahi hai */}
        {(!loopData || loopData.length === 0) && (
          <div className="h-screen flex flex-col items-center justify-center gap-4">
            <div className="w-20 h-20 rounded-full flex items-center justify-center"
              style={{ background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.2)' }}>
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#7C3AED" strokeWidth="1.5">
                <polygon points="23 7 16 12 23 17 23 7" /><rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
              </svg>
            </div>
            <p className="text-white font-semibold">No Loops Yet</p>
            <p className="text-sm text-center px-8" style={{ color: '#6B7280' }}>
              Upload your first loop or follow creators to see their content
            </p>
            <button className="px-6 py-2.5 rounded-full btn-gradient text-sm font-semibold text-white"
              onClick={() => navigate('/upload')}>
              Create Loop
            </button>
          </div>
        )}
      </div>

      <Nav />
    </div>
  )
}

export default Loops
