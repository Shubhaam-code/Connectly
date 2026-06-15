import React from 'react'
import { useNavigate } from 'react-router-dom'
import { MdOutlineKeyboardBackspace, MdOutlineLogout } from 'react-icons/md'
import { useDispatch, useSelector } from 'react-redux'
import { setUserData } from '../redux/userSlice'
import axiosInstance from '../lib/axiosInstance'
import dp from '../assets/dp.webp'

// HINGLISH: Settings page — CONNECTLY ka premium settings screen
function Settings() {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const { userData } = useSelector(state => state.user)

  const handleLogOut = async () => {
    try {
      await axiosInstance.get("/api/auth/signout")
      dispatch(setUserData(null))
    } catch (error) {
      console.error("logout error:", error.message)
      dispatch(setUserData(null))
    }
  }

  // HINGLISH: Settings items — sections ke saath grouped
  const sections = [
    {
      title: 'Account',
      items: [
        {
          icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#7C3AED" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>,
          label: 'Edit Profile',
          action: () => navigate('/editprofile')
        },
        {
          icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#7C3AED" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>,
          label: 'Privacy & Security',
          action: () => { }
        },
        {
          icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#7C3AED" strokeWidth="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" /></svg>,
          label: 'Saved Posts',
          action: () => navigate(`/profile/${userData?.userName}`)
        },
      ]
    },
    {
      title: 'Preferences',
      items: [
        {
          icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#EC4899" strokeWidth="2"><circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" /><line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" /><line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" /></svg>,
          label: 'Appearance',
          badge: 'Dark',
          action: () => { }
        },
        {
          icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#EC4899" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></svg>,
          label: 'Notifications',
          action: () => navigate('/notifications')
        },
        {
          icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#EC4899" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" /></svg>,
          label: 'Language',
          badge: 'English',
          action: () => { }
        },
      ]
    },
    {
      title: 'AI Preferences',
      items: [
        {
          icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#06B6D4" strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2" ry="2" /><line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" /></svg>,
          label: 'AI Personalization',
          action: () => navigate('/ai-friend')
        },
        {
          icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#06B6D4" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>,
          label: 'AI Memory',
          action: () => navigate('/ai-friend')
        },
        {
          icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#06B6D4" strokeWidth="2"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" /></svg>,
          label: 'AI Voice',
          badge: 'Coming Soon',
          action: () => { }
        },
      ]
    },
    {
      title: 'Support',
      items: [
        {
          icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>,
          label: 'Help Center',
          action: () => { }
        },
        {
          icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>,
          label: 'About CONNECTLY',
          badge: 'v1.0',
          action: () => { }
        },
      ]
    }
  ]

  return (
    <div className="w-full min-h-screen" style={{ background: '#0D1117' }}>

      {/* HINGLISH: Header */}
      <div className="sticky top-0 z-40 flex items-center gap-3 px-4 py-4"
        style={{ background: 'rgba(13,17,23,0.95)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <button className="text-gray-400 hover:text-white transition-colors"
          onClick={() => navigate(`/profile/${userData?.userName}`)}>
          <MdOutlineKeyboardBackspace size={22} />
        </button>
        <h1 className="text-base font-bold text-white">Settings</h1>
      </div>

      <div className="max-w-[500px] mx-auto px-4 pt-6 pb-16">

        {/* HINGLISH: User profile summary card */}
        <div className="flex items-center gap-4 p-4 rounded-2xl mb-6 cursor-pointer hover:bg-white/5 transition-all"
          style={{ background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.2)' }}
          onClick={() => navigate(`/profile/${userData?.userName}`)}>
          <div className="story-ring-active">
            <div className="w-14 h-14 rounded-full overflow-hidden" style={{ background: '#0D1117' }}>
              <img src={userData?.profileImage || dp} alt="" className="w-full h-full object-cover" />
            </div>
          </div>
          <div>
            <div className="text-white font-bold">{userData?.name}</div>
            <div className="text-sm" style={{ color: '#9CA3AF' }}>@{userData?.userName}</div>
            <div className="text-xs mt-0.5 gradient-text font-medium">{userData?.profession || "CONNECTLY Creator"}</div>
          </div>
          <svg className="ml-auto text-gray-500" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </div>

        {/* HINGLISH: Settings sections */}
        {sections.map((section) => (
          <div key={section.title} className="mb-6">
            <h2 className="text-xs font-semibold uppercase tracking-wider mb-3 px-1"
              style={{ color: '#6B7280' }}>
              {section.title}
            </h2>
            <div className="rounded-2xl overflow-hidden" style={{ background: '#1C2333', border: '1px solid rgba(255,255,255,0.06)' }}>
              {section.items.map((item, index) => (
                <button
                  key={item.label}
                  className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-white/5 transition-all text-left"
                  style={{ borderBottom: index < section.items.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}
                  onClick={item.action}>

                  {/* HINGLISH: Icon in circle */}
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: 'rgba(255,255,255,0.05)' }}>
                    {item.icon}
                  </div>

                  <span className="flex-1 text-sm font-medium text-white">{item.label}</span>

                  {/* HINGLISH: Badge (Coming Soon, Dark, etc.) */}
                  {item.badge && (
                    <span className="text-xs px-2 py-0.5 rounded-full mr-2"
                      style={{
                        background: item.badge === 'Coming Soon' ? 'rgba(239,68,68,0.1)' : 'rgba(124,58,237,0.1)',
                        color: item.badge === 'Coming Soon' ? '#F87171' : '#C4B5FD',
                        border: '1px solid',
                        borderColor: item.badge === 'Coming Soon' ? 'rgba(239,68,68,0.2)' : 'rgba(124,58,237,0.2)'
                      }}>
                      {item.badge}
                    </span>
                  )}

                  <svg className="text-gray-600 flex-shrink-0" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </button>
              ))}
            </div>
          </div>
        ))}

        {/* HINGLISH: Logout button at bottom */}
        <button
          className="w-full flex items-center justify-center gap-3 h-[52px] rounded-2xl font-semibold text-sm transition-all hover-scale"
          style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#F87171' }}
          onClick={handleLogOut}>
          <MdOutlineLogout size={20} />
          Log Out
        </button>

        <p className="text-center text-xs mt-6" style={{ color: '#374151' }}>
          CONNECTLY v1.0.0 • Made with 💜
        </p>
      </div>
    </div>
  )
}

export default Settings
