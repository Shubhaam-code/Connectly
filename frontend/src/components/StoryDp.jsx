import React from 'react'
import dp from "../assets/dp.webp"
import { FiPlusCircle } from "react-icons/fi"
import { useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import axiosInstance from '../lib/axiosInstance'

// HINGLISH: Story DP component — stories row mein circular avatars with gradient rings
function StoryDp({ ProfileImage, userName, story }) {
  const navigate = useNavigate()
  const { userData } = useSelector(state => state.user)
  const { storyData, storyList } = useSelector(state => state.story)

  // HINGLISH: Check karein ki story already dekhi gayi hai ya nahi
  const viewed = story?.viewers?.some((viewer) =>
    viewer?._id?.toString() === userData._id.toString() ||
    viewer?.toString() === userData._id.toString()
  )

  const handleViewers = async () => {
    try {
      await axiosInstance.get(`/api/story/view/${story._id}`)
    } catch (error) {
      console.error("viewStory error:", error.message)
    }
  }

  const handleClick = () => {
    if (!story && userName === "Your Story") {
      navigate("/upload")
    } else if (story && userName === "Your Story") {
      handleViewers()
      navigate(`/story/${userData?.userName}`)
    } else {
      handleViewers()
      navigate(`/story/${userName}`)
    }
  }

  return (
    <div className="flex flex-col items-center gap-2 cursor-pointer hover-scale flex-shrink-0" onClick={handleClick}>
      {/* HINGLISH: Gradient ring — unseen = purple-pink, seen = grey */}
      <div className={`w-[72px] h-[72px] rounded-full p-[2.5px] flex items-center justify-center ${!story ? '' : !viewed ? 'connectly-story-ring' : 'connectly-story-ring-seen'}`}
        style={!story ? { background: '#262626' } : undefined}>
        {/* HINGLISH: Inner avatar circle with white gap */}
        <div className="w-full h-full rounded-full overflow-hidden relative"
          style={{ background: '#000000', padding: '2px' }}>
          <div className="w-full h-full rounded-full overflow-hidden">
            <img src={ProfileImage || dp} alt="" className="w-full h-full object-cover" />
          </div>

          {/* HINGLISH: "+" icon agar apni story nahi hai to */}
          {!story && userName === "Your Story" && (
            <div className="absolute bottom-0 right-0">
              <div className="w-5 h-5 rounded-full flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #7C3AED, #EC4899)' }}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                  <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                </svg>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* HINGLISH: Username label below avatar */}
      <span className="text-xs text-center truncate w-[72px] font-medium"
        style={{ color: !story ? '#9CA3AF' : !viewed ? '#FFFFFF' : '#6B7280' }}>
        {userName === "Your Story" ? "Your Story" : userName}
      </span>
    </div>
  )
}

export default StoryDp