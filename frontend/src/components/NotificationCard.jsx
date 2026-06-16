import React from 'react'
import dp from "../assets/dp.webp"
import { useNavigate } from 'react-router-dom'
import FollowButton from './FollowButton'
import { formatTime } from '../utils/formatters'
import { Avatar } from './ui/UIComponents'

// HINGLISH: Notification card — ek notification row ka dark glassmorphism style
function NotificationCard({ noti, compact }) {
  const navigate = useNavigate()

  if (compact) {
    // HINGLISH: Compact version — sidebar ke andar
    return (
      <div className="flex items-center gap-2 p-2 rounded-xl cursor-pointer hover:bg-[var(--hover)] transition-all">
        <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0">
          <Avatar src={noti.sender?.profileImage || dp} alt="" size="w-full h-full" className="w-full h-full hover:scale-100" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-[var(--text-primary)] truncate">
            <span className="font-semibold">{noti.sender?.userName}</span>{' '}
            <span className="text-[var(--text-secondary)]">{noti.message}</span>
          </p>
        </div>
      </div>
    )
  }

  const handleClick = () => {
    if (noti.type === "follow" || noti.type === "follow_accepted") {
      navigate(`/profile/${noti.sender?.userName}`)
    } else if (noti.type === "message" || noti.type === "story_reaction") {
      navigate("/messages")
    } else if (noti.post) {
      navigate(`/profile/${noti.post.author?.userName || noti.sender?.userName}`)
    } else if (noti.loop) {
      navigate(`/profile/${noti.loop.author?.userName || noti.sender?.userName}`)
    }
  }

  return (
    // HINGLISH: Full notification card
    <div 
      onClick={handleClick}
      className={`flex items-center gap-3 p-3 rounded-2xl cursor-pointer hover:bg-[var(--hover)] transition-all ${
        !noti.isRead 
          ? 'bg-purple-500/5 dark:bg-purple-950/20 border border-[var(--primary)]/20 shadow-sm' 
          : 'border border-[var(--border)]'
      }`}
    >

      {/* HINGLISH: Sender avatar with gradient ring */}
      <div className="relative flex-shrink-0">
        <div className={`${!noti.isRead ? 'story-ring-active' : 'story-ring-seen'}`}>
          <div className="w-11 h-11 rounded-full overflow-hidden bg-[var(--background)]">
            <Avatar src={noti.sender?.profileImage || dp} alt="" size="w-full h-full" className="w-full h-full hover:scale-100" />
          </div>
        </div>
        {/* HINGLISH: Unread dot */}
        {!noti.isRead && (
          <div className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[var(--background)] bg-gradient-to-r from-purple-600 to-pink-500 shadow-sm animate-pulse" />
        )}
      </div>

      {/* HINGLISH: Notification text + follow button */}
      <div className="flex-1 min-w-0">
        <p className="text-sm text-[var(--text-primary)]">
          <span className="font-semibold hover:underline"
            onClick={() => navigate(`/profile/${noti.sender?.userName}`)}
            style={{ cursor: 'pointer' }}>
            {noti.sender?.userName}
          </span>{' '}
          <span className="text-[var(--text-secondary)]">{noti.message}</span>
        </p>
        <p className="text-xs mt-0.5 text-[var(--text-muted)]">{formatTime(noti.createdAt)}</p>
      </div>

      {/* HINGLISH: Media thumbnail (post/loop) ya Follow button */}
      <div className="flex-shrink-0">
        {noti.loop ? (
          <div className="w-10 h-10 rounded-xl overflow-hidden">
            <video src={noti?.loop?.media} muted className="h-full w-full object-cover" />
          </div>
        ) : noti.post?.mediaType === "image" ? (
          <div className="w-10 h-10 rounded-xl overflow-hidden">
            <img src={noti.post?.media} alt="" className="h-full w-full object-cover" />
          </div>
        ) : noti.post ? (
          <div className="w-10 h-10 rounded-xl overflow-hidden">
            <video src={noti.post?.media} muted loop className="h-full w-full object-cover" />
          </div>
        ) : (noti.type === "follow" || noti.type === "follow_accepted") ? (
          // HINGLISH: Follow notification ke liye follow button
          <FollowButton
            tailwind="px-3 py-1.5 rounded-full text-xs font-semibold btn-gradient"
            targetUserId={noti.sender?._id}
          />
        ) : null}
      </div>
    </div>
  )
}

export default NotificationCard
