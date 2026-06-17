import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import dp from "../assets/dp.webp"
import FollowButton from './FollowButton'
import AccountSwitcherModal from './layout/AccountSwitcherModal'
import { FiFileText, FiMessageSquare, FiHeart, FiBookmark, FiChevronRight, FiEye, FiTrendingUp, FiUsers, FiMail, FiBarChart2, FiUserPlus } from 'react-icons/fi'
import { Avatar } from './ui/UIComponents'
import { formatTime } from '../utils/formatters'
import axiosInstance from '../lib/axiosInstance'
import NewsModal from './news/NewsModal'
import SuggestionsModal from './layout/SuggestionsModal'
import CreatorInsights from './profile/CreatorInsights'

function RightHome() {
  const { userData, suggestedUsers, following } = useSelector(state => state.user)
  const navigate = useNavigate()
  const [isSwitcherOpen, setIsSwitcherOpen] = useState(false)
  const [isSuggestionsOpen, setIsSuggestionsOpen] = useState(false)
  const [analytics, setAnalytics] = useState(null)
  const [analyticsLoading, setAnalyticsLoading] = useState(true)

  useEffect(() => {
    let active = true
    const fetchAnalytics = async () => {
      try {
        const res = await axiosInstance.get('/api/analytics/profile')
        if (active && res.data && res.data.success) {
          setAnalytics(res.data.data)
        }
      } catch (err) {
        console.error('Error fetching analytics:', err)
      } finally {
        if (active) setAnalyticsLoading(false)
      }
    }
    fetchAnalytics()
    return () => {
      active = false
    }
  }, [following]) // Re-fetch on follow change to update growth metrics

  const suggestions = suggestedUsers
    ?.filter(u => u._id !== userData?._id && !following?.some(id => id?.toString() === u._id?.toString()))
    ?.slice(0, 3) || []

  const footerLinks = ['About', 'Help', 'Privacy', 'Terms', 'API']

  return (
    <aside
      className="hidden xl:block w-[320px] pt-8 pl-6 h-fit sticky top-0 bg-[var(--background)] flex-shrink-0"
    >
      {/* Current User Card */}
      <div
        className="flex items-center justify-between p-3 rounded-xl mb-6 bg-[var(--card)] border border-[var(--border)]"
      >
        <div
          className="flex items-center gap-3 cursor-pointer flex-1 min-w-0"
          onClick={() => navigate(`/profile/${userData?.userName}`)}
        >
          <div className="connectly-story-ring flex-shrink-0">
            <div className="w-11 h-11 rounded-full overflow-hidden bg-[var(--background)]">
              <Avatar src={userData?.profileImage || dp} alt="" size="w-full h-full" className="w-full h-full hover:scale-100" />
            </div>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-[var(--text)] truncate">{userData?.userName}</p>
            <p className="text-xs truncate text-[var(--text-secondary)]">{userData?.name}</p>
          </div>
        </div>
        <button
          onClick={() => setIsSwitcherOpen(true)}
          className="text-xs font-semibold connectly-gradient-text hover:opacity-80 transition-opacity flex-shrink-0"
        >
          Switch
        </button>
      </div>

      {/* Suggested Users */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4 px-1">
          <span className="text-sm font-semibold text-[var(--text-secondary)]">Suggested for you</span>
          <button
            onClick={() => setIsSuggestionsOpen(true)}
            className="text-xs font-semibold text-[var(--primary)] hover:opacity-85 transition-opacity"
          >
            View More →
          </button>
        </div>

        <div className="flex flex-col gap-3">
          {suggestions.length > 0 ? suggestions.map(user => (
            <div key={user._id} className="flex items-center justify-between px-1">
              <div
                className="flex items-center gap-3 cursor-pointer flex-1 min-w-0"
                onClick={() => navigate(`/profile/${user.userName}`)}
              >
                <div className="w-9 h-9 rounded-full overflow-hidden flex-shrink-0 border border-[var(--border)]">
                  <Avatar src={user.profileImage || dp} alt="" size="w-full h-full" className="w-full h-full hover:scale-100" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[var(--text)] truncate">{user.userName}</p>
                  <p className="text-xs truncate text-[var(--text-secondary)]">
                    {user.profession || 'Suggested for you'}
                  </p>
                </div>
              </div>
              <FollowButton targetUserId={user._id} />
            </div>
          )) : (
            <p className="text-xs px-1 text-[var(--text-secondary)]">No suggestions right now</p>
          )}
        </div>
      </div>

      {/* Social Analytics Dashboard Widget */}
      {userData && (
        <div className="mb-6 border-t border-[var(--border)] pt-4">
          <CreatorInsights
            likes={analytics?.totalLikes || 0}
            impressions={analytics?.profileImpressions || 0}
            visitors={analytics?.profileVisitors || 0}
            saves={analytics?.totalSaves || 0}
            loading={analyticsLoading}
            weeklyGrowth={analytics?.weeklyGrowth || "+0"}
          />
        </div>
      )}

      {/* Footer */}
      <footer className="px-1 pb-8">
        <div className="flex flex-wrap gap-x-2 gap-y-1 mb-3">
          {footerLinks.map((link, i) => (
            <React.Fragment key={link}>
              <button className="text-[11px] hover:underline text-[var(--text-secondary)]">{link}</button>
              {i < footerLinks.length - 1 && <span className="text-[var(--border)]">·</span>}
            </React.Fragment>
          ))}
        </div>
        <p className="text-[11px] uppercase tracking-wide text-[var(--text-muted)]">
          © 2026 CONNECTLY
        </p>
      </footer>
      <AccountSwitcherModal isOpen={isSwitcherOpen} onClose={() => setIsSwitcherOpen(false)} />
      <SuggestionsModal isOpen={isSuggestionsOpen} onClose={() => setIsSuggestionsOpen(false)} />
    </aside>
  )
}

export default RightHome
