import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { MdOutlineKeyboardBackspace } from 'react-icons/md'
import { useDispatch, useSelector } from 'react-redux'
import NotificationCard from '../components/NotificationCard'
import axiosInstance from '../lib/axiosInstance'
import { setNotificationData } from '../redux/userSlice'
import Nav from '../components/Nav'

// HINGLISH: Notifications page — all notifications with tabs (compact prop = sidebar ke andar show karna)
function Notifications({ compact }) {
  const navigate = useNavigate()
  const { notificationData } = useSelector(state => state.user)
  const ids = notificationData.map((n) => n._id)
  const dispatch = useDispatch()

  // HINGLISH: Notifications ko read mark karna
  const markAsRead = async () => {
    try {
      await axiosInstance.post("/api/user/markAsRead", { notificationId: ids })
      await fetchNotifications()
    } catch (error) {
      console.error("markAsRead error:", error.message)
    }
  }

  const fetchNotifications = async () => {
    try {
      const result = await axiosInstance.get("/api/user/getAllNotifications")
      dispatch(setNotificationData(result.data))
    } catch (error) {
      console.error("fetchNotifications error:", error.message)
    }
  }

  useEffect(() => { markAsRead() }, [])

  if (compact) {
    // HINGLISH: Compact mode — sidebar ke andar use hota hai
    return (
      <div className="flex flex-col gap-2 px-2">
        {notificationData?.length === 0 && (
          <p className="text-center py-6 text-sm" style={{ color: '#6B7280' }}>No notifications</p>
        )}
        {notificationData?.map((noti, index) => (
          <NotificationCard noti={noti} key={index} compact />
        ))}
      </div>
    )
  }

  return (
    <div className="w-full min-h-screen pb-24 lg:pb-0" style={{ background: '#0D1117' }}>

      {/* HINGLISH: Header */}
      <div className="sticky top-0 z-40 px-5 py-4"
        style={{ background: 'rgba(13,17,23,0.95)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="flex items-center gap-3 mb-4">
          <button className="lg:hidden text-gray-400 hover:text-white"
            onClick={() => navigate('/')}>
            <MdOutlineKeyboardBackspace size={22} />
          </button>
          <h1 className="text-xl font-bold text-white">Notifications</h1>
          {/* HINGLISH: Unread count badge */}
          {notificationData.filter(n => !n.isRead).length > 0 && (
            <div className="px-2 py-0.5 rounded-full text-xs text-white font-semibold"
              style={{ background: 'linear-gradient(135deg, #7C3AED, #EC4899)' }}>
              {notificationData.filter(n => !n.isRead).length} new
            </div>
          )}
          {/* HINGLISH: Edit icon on right */}
          <button className="ml-auto w-9 h-9 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(255,255,255,0.05)' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
          </button>
        </div>

        {/* HINGLISH: Filter tabs — All, Mentions, Likes, Follows */}
        <div className="flex gap-2">
          {["All", "Mentions", "Likes", "Follows"].map((tab, i) => (
            <button key={tab}
              className="px-3 py-1.5 rounded-full text-xs font-medium transition-all"
              style={{
                background: i === 0 ? 'linear-gradient(135deg, #7C3AED, #EC4899)' : 'rgba(255,255,255,0.05)',
                color: i === 0 ? 'white' : '#9CA3AF',
                border: i === 0 ? 'none' : '1px solid rgba(255,255,255,0.08)'
              }}>
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* HINGLISH: Notifications list */}
      <div className="flex flex-col gap-2 px-4 pt-4">
        {notificationData?.length === 0 && (
          <div className="flex flex-col items-center gap-3 py-20">
            <div className="text-4xl">🔔</div>
            <p className="text-white font-semibold">No notifications yet</p>
            <p className="text-sm text-center" style={{ color: '#6B7280' }}>
              When someone likes or comments on your posts, you'll see it here
            </p>
          </div>
        )}
        {notificationData?.map((noti, index) => (
          <NotificationCard noti={noti} key={index} />
        ))}
      </div>

      <Nav />
    </div>
  )
}

export default Notifications
