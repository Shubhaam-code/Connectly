import axiosInstance from '../lib/axiosInstance'
import React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { toggleFollow } from '../redux/userSlice'

// HINGLISH: Follow button — gradient follow / outlined following state
function FollowButton({ targetUserId, tailwind, onFollowChange }) {
  const { following, userData } = useSelector(state => state.user)
  // FIX: Use .toString() for proper ObjectId vs string comparison
  // following array from Redux may contain ObjectId objects or plain strings
  const isFollowing = following.some(id => id.toString() === targetUserId?.toString())
  const dispatch = useDispatch()

  // HINGLISH: Apne aap ko follow nahi kar sakte
  if (targetUserId === userData?._id) return null

  const handleFollow = async () => {
    try {
      await axiosInstance.get(`/api/user/follow/${targetUserId}`)
      if (onFollowChange) onFollowChange()
      dispatch(toggleFollow(targetUserId))
    } catch (error) {
      console.error("follow error:", error.message)
    }
  }

  // HINGLISH: Agar custom tailwind diya hai to use karo, warna default gradient style
  if (tailwind) {
    return (
      <button className={tailwind} onClick={handleFollow} style={
        !isFollowing ? {} : { background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)' }
      }>
        {isFollowing ? "Following" : "Follow"}
      </button>
    )
  }

  return (
    <button
      className="px-4 py-1.5 rounded-full text-xs font-semibold transition-all hover-scale"
      style={{
        background: isFollowing ? 'rgba(255,255,255,0.05)' : 'linear-gradient(135deg, #7C3AED, #EC4899)',
        color: 'white',
        border: isFollowing ? '1px solid rgba(255,255,255,0.15)' : 'none'
      }}
      onClick={handleFollow}>
      {isFollowing ? "Following" : "Follow"}
    </button>
  )
}

export default FollowButton