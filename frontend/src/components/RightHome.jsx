import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import dp from "../assets/dp.webp"
import FollowButton from './FollowButton'
import AccountSwitcherModal from './layout/AccountSwitcherModal'
import { FiHeart, FiBookmark, FiChevronRight, FiEye, FiUsers, FiUserPlus, FiUser, FiActivity } from 'react-icons/fi'
import { Avatar } from './ui/UIComponents'
import axiosInstance from '../lib/axiosInstance'
import SuggestionsModal from './layout/SuggestionsModal'

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
  }, [following])

  const suggestions = suggestedUsers
    ?.filter(u => u._id !== userData?._id && !following?.some(id => id?.toString() === u._id?.toString()))
    ?.slice(0, 3) || []

  const footerLinks = ['About', 'Help', 'Privacy', 'Terms', 'API']

  return (
    <aside
      className="hidden xl:block w-[320px] pt-8 pl-6 h-fit sticky top-0 bg-transparent flex-shrink-0"
    >
      {/* Premium Current Creator Card */}
      <div
        className="bg-[var(--card)]/75 backdrop-blur-2xl border border-[var(--border)] rounded-[24px] p-5 mb-5 shadow-xl flex flex-col gap-4 text-left select-none relative overflow-hidden group transition-all duration-300 hover:border-purple-500/10"
      >
        <div className="absolute -top-10 -right-10 w-24 h-24 rounded-full bg-purple-500/5 blur-xl group-hover:bg-purple-500/10 transition-all duration-300" />
        
        <div className="flex items-center justify-between">
          <div
            className="flex items-center gap-3 cursor-pointer flex-1 min-w-0"
            onClick={() => navigate(`/profile/${userData?.userName}`)}
          >
            <div className="w-11 h-11 rounded-full p-[2px] bg-gradient-to-tr from-[#8B5CF6] via-[#EC4899] to-[#3B82F6] flex-shrink-0">
              <div className="w-full h-full rounded-full overflow-hidden bg-[var(--card)] p-[1px]">
                <Avatar src={userData?.profileImage || dp} alt="" size="w-full h-full" className="w-full h-full object-cover rounded-full" />
              </div>
            </div>
            <div className="min-w-0 text-left">
              <p className="text-xs font-black text-[var(--text)] hover:text-[var(--primary)] transition-colors truncate flex items-center gap-1">
                {userData?.userName}
                {userData?.isVerified && (
                  <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-blue-500 flex-shrink-0" title="Verified Creator">
                    <path d="M12.003 21.602c-5.305 0-9.602-4.298-9.602-9.602s4.298-9.602 9.602-9.602c5.305 0 9.602 4.298 9.602 9.602s-4.298 9.602-9.602 9.602zm-1.802-5.402l6.602-6.601-1.401-1.401-5.201 5.2-2.201-2.201-1.4 1.401 3.601 3.602z" />
                  </svg>
                )}
              </p>
              <p className="text-[9px] uppercase font-bold tracking-wider text-[var(--text-secondary)] truncate">
                {userData?.profession || 'CONNECTLY Creator'}
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsSwitcherOpen(true)}
            className="text-[9px] font-black uppercase tracking-wider bg-white/5 border border-[var(--border)] px-2.5 py-1.5 rounded-lg hover:bg-white/10 hover:text-white transition-all cursor-pointer flex-shrink-0 text-[var(--text-secondary)]"
          >
            Switch
          </button>
        </div>

        {/* Creator Mini Stats Grid */}
        <div className="grid grid-cols-3 gap-2 py-2 border-y border-[var(--border)] text-center text-xs">
          <div>
            <p className="font-extrabold text-[var(--text)]">{userData?.posts?.length || 0}</p>
            <p className="text-[8px] uppercase tracking-wider font-bold text-[var(--text-secondary)]">Posts</p>
          </div>
          <div>
            <p className="font-extrabold text-[var(--text)]">{userData?.followers?.length || 0}</p>
            <p className="text-[8px] uppercase tracking-wider font-bold text-[var(--text-secondary)]">Followers</p>
          </div>
          <div>
            <p className="font-extrabold text-[var(--text)]">{userData?.following?.length || 0}</p>
            <p className="text-[8px] uppercase tracking-wider font-bold text-[var(--text-secondary)]">Following</p>
          </div>
        </div>

        <button
          onClick={() => navigate(`/profile/${userData?.userName}`)}
          className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#8B5CF6] via-[#A855F7] to-[#EC4899] text-white text-xs font-black uppercase tracking-wider transition-all hover:opacity-95 hover:shadow-[0_4px_15px_rgba(139,92,246,0.3)] cursor-pointer"
        >
          View Profile
        </button>
      </div>

      {/* Suggested Users */}
      <div className="mb-5 bg-[var(--card)]/75 backdrop-blur-2xl border border-[var(--border)] rounded-[24px] p-5 shadow-xl select-none transition-all duration-300 hover:border-purple-500/10">
        <div className="flex items-center justify-between mb-4 px-1">
          <span className="text-[10px] font-black uppercase tracking-wider text-[var(--text-secondary)]">Suggested for you</span>
          <button
            onClick={() => setIsSuggestionsOpen(true)}
            className="text-[9px] font-black uppercase tracking-wider text-[var(--primary)] hover:text-[var(--hover)] transition-colors"
          >
            View More
          </button>
        </div>

        <div className="flex flex-col gap-4">
          {suggestions.length > 0 ? suggestions.map(user => (
            <div key={user._id} className="flex items-center justify-between px-1">
              <div
                className="flex items-center gap-3 cursor-pointer flex-1 min-w-0 text-left"
                onClick={() => navigate(`/profile/${user.userName}`)}
              >
                <div className="w-9 h-9 rounded-full overflow-hidden flex-shrink-0 border border-white/5 shadow-md">
                  <Avatar src={user.profileImage || dp} alt="" size="w-full h-full" className="w-full h-full object-cover rounded-full" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-[var(--text)] truncate flex items-center gap-0.5 hover:text-[var(--primary)] transition-colors">
                    {user.userName}
                    {user.isVerified && (
                      <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-blue-500 flex-shrink-0">
                        <path d="M12.003 21.602c-5.305 0-9.602-4.298-9.602-9.602s4.298-9.602 9.602-9.602c5.305 0 9.602 4.298 9.602 9.602s-4.298 9.602-9.602 9.602zm-1.802-5.402l6.602-6.601-1.401-1.401-5.201 5.2-2.201-2.201-1.4 1.401 3.601 3.602z" />
                      </svg>
                    )}
                  </p>
                  <p className="text-[8px] uppercase tracking-wider font-semibold text-[var(--text-secondary)] truncate">
                    {user.profession || 'Suggested Creator'}
                  </p>
                </div>
              </div>
              <FollowButton 
                targetUserId={user._id} 
                tailwind="px-3.5 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider btn-gradient"
              />
            </div>
          )) : (
            <p className="text-[9px] font-bold px-1 text-[var(--text-secondary)] uppercase tracking-wider py-2">No suggestions right now</p>
          )}
        </div>
      </div>

      {/* Creator Stats Section */}
      {userData && (
        <div className="mb-5 bg-[var(--card)]/75 backdrop-blur-2xl border border-[var(--border)] rounded-[24px] p-5 shadow-xl select-none text-left transition-all duration-300 hover:border-purple-500/10">
          <div className="flex items-center justify-between mb-4 px-1">
            <span className="text-[10px] font-black uppercase tracking-wider text-[var(--text-secondary)]">Creator Stats</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Views', value: analytics?.profileImpressions || 0, icon: FiEye, color: 'text-blue-500', bg: 'bg-blue-500/10' },
              { label: 'Likes', value: analytics?.totalLikes || 0, icon: FiHeart, color: 'text-pink-500', bg: 'bg-pink-500/10' },
              { label: 'Saves', value: analytics?.totalSaves || 0, icon: FiBookmark, color: 'text-yellow-500', bg: 'bg-yellow-500/10' },
              { label: 'Visitors', value: analytics?.profileVisitors || 0, icon: FiUsers, color: 'text-green-500', bg: 'bg-green-500/10' },
            ].map((stat, i) => {
              const Icon = stat.icon;
              return (
                <div key={i} className="bg-white/5 border border-white/5 rounded-2xl p-3 flex flex-col justify-between min-h-[85px] hover:border-purple-500/10 transition-colors">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] uppercase tracking-wider font-bold text-[var(--text-secondary)]">{stat.label}</span>
                    <div className={`w-6 h-6 rounded-lg ${stat.bg} flex items-center justify-center`}>
                      <Icon size={12} className={stat.color} />
                    </div>
                  </div>
                  <p className="text-base font-black text-[var(--text)] mt-2">
                    {analyticsLoading ? '...' : (stat.value).toLocaleString()}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="px-2 pb-8">
        <div className="flex flex-wrap gap-x-2 gap-y-1 mb-3 justify-start">
          {footerLinks.map((link, i) => (
            <React.Fragment key={link}>
              <button className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)] hover:text-[var(--text)] transition-colors">{link}</button>
              {i < footerLinks.length - 1 && <span className="text-[var(--border)] select-none">·</span>}
            </React.Fragment>
          ))}
        </div>
        <p className="text-[9px] uppercase tracking-widest text-[var(--text-muted)] font-black text-left">
          © 2026 CONNECTLY
        </p>
      </footer>
      <AccountSwitcherModal isOpen={isSwitcherOpen} onClose={() => setIsSwitcherOpen(false)} />
      <SuggestionsModal isOpen={isSuggestionsOpen} onClose={() => setIsSuggestionsOpen(false)} />
    </aside>
  )
}

export default RightHome
