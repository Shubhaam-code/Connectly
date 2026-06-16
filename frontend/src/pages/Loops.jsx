import React, { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import LoopCard from '../components/LoopCard'
import { useSelector } from 'react-redux'
import Layout from '../components/layout/Layout'
import { FiVideo } from 'react-icons/fi'

// HINGLISH: Loops/Reels page — TikTok-style full screen video feed wrapped in Layout
function Loops() {
  const navigate = useNavigate()
  const { loopData } = useSelector(state => state.loop)
  const [activeIndex, setActiveIndex] = useState(0)
  const containerRef = useRef()

  // Handle arrow keys scrolling
  useEffect(() => {
    if (!loopData || loopData.length === 0) return
    
    const handleKeyDown = (e) => {
      if (e.key === "ArrowDown" && activeIndex < loopData.length - 1) {
        e.preventDefault()
        setActiveIndex(prev => prev + 1)
      } else if (e.key === "ArrowUp" && activeIndex > 0) {
        e.preventDefault()
        setActiveIndex(prev => prev - 1)
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [activeIndex, loopData?.length])

  // Scroll active index item into view smoothly
  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    const child = container.children[activeIndex]
    if (child) {
      child.scrollIntoView({ behavior: "smooth", block: "start" })
    }
  }, [activeIndex])

  return (
    <Layout>
      <div className="w-full h-full bg-[var(--background)] flex justify-center relative overflow-hidden">

        {/* Snap scroll container */}
        <div 
          ref={containerRef}
          className="w-full max-w-[480px] h-full overflow-y-scroll snap-y snap-mandatory scrollbar-none"
          onScroll={(e) => {
            const containerHeight = e.target.clientHeight || window.innerHeight
            const index = Math.round(e.target.scrollTop / containerHeight)
            if (index !== activeIndex && index >= 0 && index < loopData.length) {
              setActiveIndex(index)
            }
          }}
        >
          {loopData && loopData.map((loop, index) => (
            <div key={loop._id || index} className="h-full snap-start">
              <LoopCard loop={loop} />
            </div>
          ))}

          {/* Empty state */}
          {(!loopData || loopData.length === 0) && (
            <div className="h-full flex flex-col items-center justify-center gap-4 text-center px-6">
              <div className="w-20 h-20 rounded-full flex items-center justify-center bg-purple-950/20 border border-purple-900/30">
                <FiVideo size={36} className="text-purple-500" />
              </div>
              <p className="text-white font-semibold">No Loops Yet</p>
              <p className="text-xs text-neutral-500 max-w-xs">
                Upload your first loop or follow creators to see their content.
              </p>
              <button 
                className="px-6 py-2.5 rounded-lg bg-blue-500 hover:bg-blue-600 text-xs font-semibold text-white transition-all"
                onClick={() => navigate('/upload')}
              >
                Create Loop
              </button>
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}

export default Loops
