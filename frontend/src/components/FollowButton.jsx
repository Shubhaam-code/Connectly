import axiosInstance from '../lib/axiosInstance'
import React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { toggleFollow } from '../redux/userSlice'

// Follow button — supports Follow, Following, Follow Back, and Friends (mutual) states
function FollowButton({ targetUserId, tailwind, onFollowChange }) {
  const { following, userData } = useSelector(state => state.user)
  const dispatch = useDispatch()

  // Apne aap ko follow nahi kar sakte
  if (targetUserId === userData?._id) return null

  const isFollowing = following.some(id => id.toString() === targetUserId?.toString())
  const isFollower = userData?.followers?.some(f => (f._id || f).toString() === targetUserId?.toString())

  const [loading, setLoading] = React.useState(false)

  const handleFollow = async () => {
    if (loading) return
    setLoading(true)
    
    // Optimistic Update
    dispatch(toggleFollow({ targetUserId, currentUser: userData }))

    try {
      await axiosInstance.get(`/api/user/follow/${targetUserId}`)
      if (onFollowChange) onFollowChange()
    } catch (error) {
      console.error("follow error:", error.message)
      // Rollback on failure
      dispatch(toggleFollow({ targetUserId, currentUser: userData }))
    } finally {
      setLoading(false)
    }
  }

  let buttonText = "Follow"
  if (isFollowing && isFollower) {
    buttonText = "Friends"
  } else if (isFollowing) {
    buttonText = "Following"
  } else if (isFollower) {
    buttonText = "Follow Back"
  }

  const isStyledFollowing = isFollowing

  // If follow state is active, strip out gradient classes to resolve specificity conflicts
  let classes = tailwind || ""
  if (isStyledFollowing) {
    classes = classes
      .split(" ")
      .filter(c => !c.includes("gradient") && !c.includes("from-") && !c.includes("to-") && !c.includes("via-"))
      .join(" ")
  }

  if (tailwind) {
    return (
      <button 
        className={`${classes} transition-all duration-300 ${
          isStyledFollowing 
            ? "bg-white/[0.08] hover:bg-white/[0.12] border border-white/10 text-white" 
            : ""
        }`} 
        onClick={handleFollow}
      >
        {buttonText}
      </button>
    )
  }

  return (
    <button
      className="px-4 py-1.5 rounded-full text-xs font-semibold transition-all duration-300 hover-scale"
      style={{
        background: isStyledFollowing ? 'rgba(255,255,255,0.05)' : 'linear-gradient(135deg, #7C3AED, #EC4899)',
        color: 'white',
        border: isStyledFollowing ? '1px solid rgba(255,255,255,0.15)' : 'none'
      }}
      onClick={handleFollow}
    >
      {buttonText}
    </button>
  )
}

export default FollowButton