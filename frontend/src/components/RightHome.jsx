import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import dp from "../assets/dp.webp"
import FollowButton from './FollowButton'
import AccountSwitcherModal from './layout/AccountSwitcherModal'
import { FiFileText, FiMessageSquare, FiHeart, FiBookmark, FiChevronRight } from 'react-icons/fi'

function RightHome() {
  const { userData, suggestedUsers, following } = useSelector(state => state.user)
  const navigate = useNavigate()
  const [isSwitcherOpen, setIsSwitcherOpen] = useState(false)

  const suggestions = suggestedUsers
    ?.filter(u => u._id !== userData?._id && !following?.some(id => id?.toString() === u._id?.toString()))
    ?.slice(0, 5) || []

  const footerLinks = ['About', 'Help', 'Privacy', 'Terms', 'API']

  return (
    <aside
      className="hidden xl:block w-[320px] pt-8 pl-6 h-fit sticky top-0 bg-[#000000] flex-shrink-0"
    >
      {/* Current User Card */}
      <div
        className="flex items-center justify-between p-3 rounded-xl mb-6"
        style={{ background: '#121212', border: '1px solid #262626' }}
      >
        <div
          className="flex items-center gap-3 cursor-pointer flex-1 min-w-0"
          onClick={() => navigate(`/profile/${userData?.userName}`)}
        >
          <div className="connectly-story-ring flex-shrink-0">
            <div className="w-11 h-11 rounded-full overflow-hidden" style={{ background: '#000' }}>
              <img src={userData?.profileImage || dp} alt="" className="w-full h-full object-cover" />
            </div>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-white truncate">{userData?.userName}</p>
            <p className="text-xs truncate" style={{ color: '#A8A8A8' }}>{userData?.name}</p>
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
          <span className="text-sm font-semibold" style={{ color: '#A8A8A8' }}>Suggested for you</span>
          <button
            onClick={() => navigate('/search')}
            className="text-xs font-semibold text-white hover:text-white/70 transition-colors"
          >
            See All
          </button>
        </div>

        <div className="flex flex-col gap-3">
          {suggestions.length > 0 ? suggestions.map(user => (
            <div key={user._id} className="flex items-center justify-between px-1">
              <div
                className="flex items-center gap-3 cursor-pointer flex-1 min-w-0"
                onClick={() => navigate(`/profile/${user.userName}`)}
              >
                <div className="w-9 h-9 rounded-full overflow-hidden flex-shrink-0" style={{ border: '1px solid #262626' }}>
                  <img src={user.profileImage || dp} alt="" className="w-full h-full object-cover" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{user.userName}</p>
                  <p className="text-xs truncate" style={{ color: '#A8A8A8' }}>
                    {user.profession || 'Suggested for you'}
                  </p>
                </div>
              </div>
              <FollowButton targetUserId={user._id} />
            </div>
          )) : (
            <p className="text-xs px-1" style={{ color: '#A8A8A8' }}>No suggestions right now</p>
          )}
        </div>
      </div>

      {/* Activity Widget */}
      {userData && (
        <div className="mb-6" style={{ borderTop: '1px solid #121212', paddingTop: '16px' }}>
          <div className="px-1 mb-4">
            <span className="text-sm font-semibold" style={{ color: '#A8A8A8' }}>Your Activity</span>
          </div>

          <div className="flex flex-col gap-3.5 bg-[#121212] border border-[#262626] rounded-xl p-4">
            {/* Posts */}
            <div 
              onClick={() => navigate(`/profile/${userData.userName}`)}
              className="flex items-center justify-between cursor-pointer group/item"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#8B5CF6]/15 flex items-center justify-center text-[#8B5CF6]">
                  <FiFileText size={16} />
                </div>
                <span className="text-xs font-medium text-gray-300 group-hover/item:text-white transition-colors">Posts</span>
              </div>
              <div className="flex items-center gap-1.5 text-gray-400 group-hover/item:text-white transition-colors">
                <span className="text-xs font-bold">{userData.activityStats?.postsCount ?? (userData.posts?.length || 0)}</span>
                <FiChevronRight size={12} />
              </div>
            </div>

            {/* Comments */}
            <div className="flex items-center justify-between cursor-pointer group/item">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-cyan-500/15 flex items-center justify-center text-cyan-400">
                  <FiMessageSquare size={16} />
                </div>
                <span className="text-xs font-medium text-gray-300 group-hover/item:text-white transition-colors">Comments</span>
              </div>
              <div className="flex items-center gap-1.5 text-gray-400 group-hover/item:text-white transition-colors">
                <span className="text-xs font-bold">{userData.activityStats?.commentsCount ?? 0}</span>
                <FiChevronRight size={12} />
              </div>
            </div>

            {/* Likes */}
            <div className="flex items-center justify-between cursor-pointer group/item">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#EC4899]/15 flex items-center justify-center text-[#EC4899]">
                  <FiHeart size={16} />
                </div>
                <span className="text-xs font-medium text-gray-300 group-hover/item:text-white transition-colors">Likes</span>
              </div>
              <div className="flex items-center gap-1.5 text-gray-400 group-hover/item:text-white transition-colors">
                <span className="text-xs font-bold">{userData.activityStats?.likesCount ?? 0}</span>
                <FiChevronRight size={12} />
              </div>
            </div>

            {/* Bookmarks */}
            <div 
              onClick={() => navigate(`/profile/${userData.userName}?tab=saved`)}
              className="flex items-center justify-between cursor-pointer group/item"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-yellow-500/15 flex items-center justify-center text-yellow-500">
                  <FiBookmark size={16} />
                </div>
                <span className="text-xs font-medium text-gray-300 group-hover/item:text-white transition-colors">Bookmarks</span>
              </div>
              <div className="flex items-center gap-1.5 text-gray-400 group-hover/item:text-white transition-colors">
                <span className="text-xs font-bold">{userData.activityStats?.bookmarksCount ?? (userData.saved?.length || 0)}</span>
                <FiChevronRight size={12} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="px-1 pb-8">
        <div className="flex flex-wrap gap-x-2 gap-y-1 mb-3">
          {footerLinks.map((link, i) => (
            <React.Fragment key={link}>
              <button className="text-[11px] hover:underline" style={{ color: '#A8A8A8' }}>{link}</button>
              {i < footerLinks.length - 1 && <span style={{ color: '#262626' }}>·</span>}
            </React.Fragment>
          ))}
        </div>
        <p className="text-[11px] uppercase tracking-wide" style={{ color: '#A8A8A8' }}>
          © 2026 CONNECTLY
        </p>
      </footer>
      <AccountSwitcherModal isOpen={isSwitcherOpen} onClose={() => setIsSwitcherOpen(false)} />
    </aside>
  )
}

export default RightHome
