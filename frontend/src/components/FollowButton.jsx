import axiosInstance from '../lib/axiosInstance'
import React, { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { toggleFollow } from '../redux/userSlice'

// Follow button — supports Follow, Following, Follow Back, and Requested states
function FollowButton({ targetUserId, tailwind, onFollowChange }) {
  const { following, userData } = useSelector(state => state.user)
  const dispatch = useDispatch()
  const [requested, setRequested] = useState(false)

  // Apne aap ko follow nahi kar sakte
  if (targetUserId === userData?._id) return null

  const isFollowing = following.some(id => id.toString() === targetUserId?.toString())
  const isFollower = userData?.followers?.some(f => (f._id || f).toString() === targetUserId?.toString())
  // Mock private account logic: 20% of users are simulated as private
  const isPrivate = targetUserId ? (targetUserId.toString().charCodeAt(targetUserId.toString().length - 1) % 5 === 0) : false;

  const handleFollow = async () => {
    try {
      if (isPrivate && !isFollowing) {
        if (requested) {
          // Cancel request
          setRequested(false)
        } else {
          // Send request
          setRequested(true)
          await axiosInstance.get(`/api/user/follow/${targetUserId}`)
          if (onFollowChange) onFollowChange()
          dispatch(toggleFollow(targetUserId))
        }
      } else {
        await axiosInstance.get(`/api/user/follow/${targetUserId}`)
        if (onFollowChange) onFollowChange()
        dispatch(toggleFollow(targetUserId))
      }
    } catch (error) {
      console.error("follow error:", error.message)
    }
  }

  let buttonText = "Follow"
  if (isFollowing) {
    buttonText = "Following"
  } else if (isPrivate && requested) {
    buttonText = "Requested"
  } else if (isFollower) {
    buttonText = "Follow Back"
  }

  const isStyledFollowing = isFollowing || (isPrivate && requested)

  // Agar custom tailwind diya hai to use karo, warna default style
  if (tailwind) {
    return (
      <button className={tailwind} onClick={handleFollow} style={
        !isStyledFollowing ? {} : { background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)' }
      }>
        {buttonText}
      </button>
    )
  }

  return (
    <button
      className="px-4 py-1.5 rounded-full text-xs font-semibold transition-all hover-scale"
      style={{
        background: isStyledFollowing ? 'rgba(255,255,255,0.05)' : 'linear-gradient(135deg, #7C3AED, #EC4899)',
        color: 'white',
        border: isStyledFollowing ? '1px solid rgba(255,255,255,0.15)' : 'none'
      }}
      onClick={handleFollow}>
      {buttonText}
    </button>
  )
}

export default FollowButton