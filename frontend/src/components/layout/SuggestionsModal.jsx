import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FiX, FiSearch, FiUserPlus, FiUsers } from 'react-icons/fi'
import { useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { Avatar } from '../ui/UIComponents'
import FollowButton from '../FollowButton'
import axiosInstance from '../../lib/axiosInstance'
import dp from "../../assets/dp.webp"

function SuggestionsModal({ isOpen, onClose }) {
  const { suggestedUsers, following, userData } = useSelector(state => state.user)
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [searchLoading, setSearchLoading] = useState(false)

  // Fetch search results when query changes
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([])
      return
    }

    const delayDebounce = setTimeout(async () => {
      setSearchLoading(true)
      try {
        const res = await axiosInstance.get(`/api/user/search?keyWord=${searchQuery}`)
        if (res.data) {
          // Filter out logged in user
          const filtered = res.data.filter(u => u._id !== userData?._id)
          setSearchResults(filtered)
        }
      } catch (err) {
        console.error('Error searching users:', err)
      } finally {
        setSearchLoading(false)
      }
    }, 405) // Debounce search request

    return () => clearTimeout(delayDebounce)
  }, [searchQuery, userData])

  if (!isOpen) return null

  // Suggestions excluding followed creators
  const suggestions = suggestedUsers
    ?.filter(u => u._id !== userData?._id && !following?.some(id => id?.toString() === u._id?.toString())) || []

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-[1000] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-[440px] max-h-[580px] bg-[var(--card)] border border-[var(--border)] rounded-2xl flex flex-col shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="p-4 border-b border-[var(--border)] flex items-center justify-between bg-[var(--background-secondary)]/40">
            <div className="flex items-center gap-2">
              <FiUserPlus className="text-[var(--primary)] text-lg" />
              <h3 className="text-sm font-bold text-[var(--text)]">Discover Creators</h3>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-[var(--hover)] text-[var(--text-secondary)] hover:text-[var(--text)] transition-colors"
            >
              <FiX size={18} />
            </button>
          </div>

          {/* Search bar */}
          <div className="p-3.5 border-b border-[var(--border)] flex items-center gap-2.5 bg-[var(--background-secondary)]/10">
            <FiSearch className="text-[var(--text-muted)] text-sm" />
            <input
              type="text"
              placeholder="Search people by username or name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-transparent text-xs text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)] font-normal"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="text-[10px] uppercase font-bold text-[var(--text-muted)] hover:text-[var(--text)]"
              >
                Clear
              </button>
            )}
          </div>

          {/* List Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {searchQuery.trim() ? (
              // Search Results view
              searchLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="w-6 h-6 rounded-full border-2 border-[var(--border)] border-t-[var(--primary)] animate-spin"></div>
                </div>
              ) : searchResults.length > 0 ? (
                searchResults.map(user => (
                  <div key={user._id} className="flex items-center justify-between p-1.5 rounded-xl hover:bg-[var(--hover)] transition-all">
                    <div
                      className="flex items-center gap-3 cursor-pointer flex-1 min-w-0"
                      onClick={() => {
                        onClose()
                        navigate(`/profile/${user.userName}`)
                      }}
                    >
                      <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 border border-[var(--border)]">
                        <Avatar src={user.profileImage || dp} alt="" size="w-full h-full" className="w-full h-full hover:scale-100" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-[var(--text)] truncate">{user.userName}</p>
                        <p className="text-[10px] text-[var(--text-secondary)] truncate">{user.name}</p>
                      </div>
                    </div>
                    <FollowButton targetUserId={user._id} />
                  </div>
                ))
              ) : (
                <div className="text-center py-16 text-xs text-[var(--text-muted)]">
                  No users found matching "{searchQuery}"
                </div>
              )
            ) : (
              // Suggested Users list
              suggestions.length > 0 ? (
                suggestions.map(user => (
                  <div key={user._id} className="flex items-center justify-between p-1.5 rounded-xl hover:bg-[var(--hover)] transition-all">
                    <div
                      className="flex items-center gap-3 cursor-pointer flex-1 min-w-0"
                      onClick={() => {
                        onClose()
                        navigate(`/profile/${user.userName}`)
                      }}
                    >
                      <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 border border-[var(--border)]">
                        <Avatar src={user.profileImage || dp} alt="" size="w-full h-full" className="w-full h-full hover:scale-100" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-[var(--text)] truncate">{user.userName}</p>
                        <div className="flex items-center gap-1.5 text-[9px] text-[var(--text-secondary)] mt-0.5">
                          {user.mutualCount > 0 ? (
                            <span className="flex items-center gap-1 text-[var(--primary)] font-medium">
                              <FiUsers size={10} />
                              {user.mutualCount} mutual{user.mutualCount > 1 ? 's' : ''}
                            </span>
                          ) : (
                            <span className="truncate">{user.profession || 'Suggested for you'}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <FollowButton targetUserId={user._id} />
                  </div>
                ))
              ) : (
                <div className="text-center py-16 text-xs text-[var(--text-muted)]">
                  No recommendations left to display!
                </div>
              )
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

export default SuggestionsModal
