import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import NotificationCard from '../components/NotificationCard'
import axiosInstance from '../lib/axiosInstance'
import { setNotificationData } from '../redux/userSlice'
import Layout from '../components/layout/Layout'
import { FiBell, FiHeart, FiMessageCircle, FiUserPlus, FiChevronDown, FiChevronUp, FiCheckCircle } from 'react-icons/fi'

// HINGLISH: Notifications page — all notifications grouped by type with accordion expand/collapse
function Notifications({ compact }) {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const { notificationData } = useSelector(state => state.user)

  // Accordion states
  const [expandedSection, setExpandedSection] = useState("all") // "all" | "likes" | "comments" | "follows"

  const fetchNotifications = async () => {
    try {
      const result = await axiosInstance.get("/api/user/getAllNotifications")
      dispatch(setNotificationData(result.data))
    } catch (error) {
      console.error("fetchNotifications error:", error.message)
    }
  }

  const markAllRead = async () => {
    const unreadIds = notificationData.filter(n => !n.isRead).map(n => n._id)
    if (unreadIds.length === 0) return
    try {
      await axiosInstance.post("/api/user/markAsRead", { notificationId: unreadIds })
      await fetchNotifications()
    } catch (error) {
      console.error("markAsRead error:", error.message)
    }
  }

  // Mark single notifications or all as read on mount
  useEffect(() => {
    const unreadIds = notificationData.filter(n => !n.isRead).map(n => n._id)
    if (unreadIds.length > 0) {
      axiosInstance.post("/api/user/markAsRead", { notificationId: unreadIds })
        .then(() => fetchNotifications())
        .catch(err => console.error(err))
    }
  }, [])

  if (compact) {
    return (
      <div className="flex flex-col gap-2 px-2">
        {notificationData?.length === 0 && (
          <p className="text-center py-6 text-xs text-neutral-500">No notifications</p>
        )}
        {notificationData?.map((noti, index) => (
          <NotificationCard noti={noti} key={index} compact />
        ))}
      </div>
    )
  }

  // Filter notifications by type
  const likesNotifications = notificationData.filter(n => n.type === "like" || n.type === "save_post")
  const commentsNotifications = notificationData.filter(n => n.type === "comment" || n.type === "reply" || n.type === "mention")
  const followsNotifications = notificationData.filter(n => n.type === "follow" || n.type === "follow_accepted")

  const sections = [
    { id: "all", label: "All Activity", count: notificationData.length, items: notificationData, icon: <FiBell size={14} /> },
    { id: "likes", label: "Likes", count: likesNotifications.length, items: likesNotifications, icon: <FiHeart size={14} /> },
    { id: "comments", label: "Comments", count: commentsNotifications.length, items: commentsNotifications, icon: <FiMessageCircle size={14} /> },
    { id: "follows", label: "Follows", count: followsNotifications.length, items: followsNotifications, icon: <FiUserPlus size={14} /> }
  ]

  const unreadCount = notificationData.filter(n => !n.isRead).length

  return (
    <Layout>
      <div className="max-w-xl mx-auto px-4 py-8 bg-[var(--background)] text-[var(--text-primary)] min-h-screen">
        
        {/* Header bar */}
        <div className="flex items-center justify-between pb-4 border-b border-[var(--border)] mb-6">
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold tracking-tight">Notifications</h1>
            {unreadCount > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[var(--primary)] text-white animate-pulse">
                {unreadCount} new
              </span>
            )}
          </div>
          {unreadCount > 0 && (
            <button 
              onClick={markAllRead}
              className="text-xs font-semibold text-[var(--primary)] hover:opacity-80 transition-opacity flex items-center gap-1"
            >
              <FiCheckCircle size={13} /> Mark all read
            </button>
          )}
        </div>

        {/* Group accordions */}
        <div className="space-y-3">
          {sections.map((sec) => {
            const isExpanded = expandedSection === sec.id
            return (
              <div 
                key={sec.id} 
                className="bg-[var(--card)] border border-[var(--border)] rounded-xl overflow-hidden transition-all duration-300"
              >
                {/* Accordion Header */}
                <button
                  onClick={() => setExpandedSection(isExpanded ? "" : sec.id)}
                  className="w-full px-4 py-3.5 flex items-center justify-between hover:bg-[var(--hover)] transition-all"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-[var(--primary)]">{sec.icon}</span>
                    <span className="text-xs font-bold text-[var(--text-primary)] tracking-wide">{sec.label}</span>
                    <span className="px-1.5 py-0.5 rounded bg-[var(--background-secondary)] text-[9px] font-bold text-[var(--text-muted)] border border-[var(--border)]">
                      {sec.count}
                    </span>
                  </div>
                  <span className="text-[var(--text-muted)]">
                    {isExpanded ? <FiChevronUp size={16} /> : <FiChevronDown size={16} />}
                  </span>
                </button>

                {/* Accordion Content */}
                {isExpanded && (
                  <div className="p-3 border-t border-[var(--border)] space-y-2 max-h-[450px] overflow-y-auto">
                    {sec.items.length > 0 ? (
                      sec.items.map((noti, index) => (
                        <NotificationCard noti={noti} key={index} />
                      ))
                    ) : (
                      <div className="text-center py-12 text-xs text-neutral-500">
                        No notifications in this category
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>

      </div>
    </Layout>
  )
}

export default Notifications
