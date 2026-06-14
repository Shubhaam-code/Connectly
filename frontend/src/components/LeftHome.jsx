import React, { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { GoHomeFill } from "react-icons/go"
import { FiSearch, FiPlusSquare, FiBell, FiSettings } from "react-icons/fi"
import { RxVideo } from "react-icons/rx"
import { BiMessageAltDetail } from "react-icons/bi"
import { FaRobot } from "react-icons/fa6"
import { MdOutlineLogout } from "react-icons/md"
import dp from "../assets/dp.webp"
import axios from 'axios'
import { serverUrl } from '../App'
import { setUserData } from '../redux/userSlice'
import Notifications from '../pages/Notifications'

// HINGLISH: Left sidebar navigation — CONNECTLY ka premium desktop nav
function LeftHome() {
  const { userData, notificationData } = useSelector(state => state.user)
  const [showNotification, setShowNotification] = useState(false)
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const location = useLocation()

  const handleLogOut = async () => {
    try {
      await axios.get(`${serverUrl}/api/auth/signout`, { withCredentials: true })
      dispatch(setUserData(null))
    } catch (error) {
      console.log(error)
    }
  }

  const unreadCount = notificationData?.filter(n => !n.isRead).length || 0

  // HINGLISH: Nav items ka array — icon, label, path sab ek jagah
  const navItems = [
    { icon: <GoHomeFill size={22} />, label: 'Home', path: '/' },
    { icon: <FiSearch size={22} />, label: 'Search', path: '/search' },
    { icon: <RxVideo size={22} />, label: 'Loops', path: '/loops' },
    { icon: <BiMessageAltDetail size={22} />, label: 'Messages', path: '/messages' },
    { icon: <FaRobot size={22} />, label: 'AI Friend', path: '/ai-friend' },
    {
      icon: (
        <div className="relative">
          <FiBell size={22} />
          {unreadCount > 0 && (
            <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold text-white"
              style={{ background: 'linear-gradient(135deg, #7C3AED, #EC4899)' }}>
              {unreadCount > 9 ? '9+' : unreadCount}
            </div>
          )}
        </div>
      ),
      label: 'Notifications', path: '/notifications', action: () => setShowNotification(prev => !prev)
    },
    { icon: <FiSettings size={22} />, label: 'Settings', path: '/settings' },
  ]

  const isActive = (path) => location.pathname === path

  return (
    // HINGLISH: Sidebar container — dark bg with subtle border
    <div className={`w-[260px] hidden lg:flex flex-col h-screen fixed left-0 top-0 z-50 
      ${showNotification ? 'overflow-hidden' : 'overflow-auto'}`}
      style={{ background: '#0D1117', borderRight: '1px solid rgba(255,255,255,0.06)' }}>

      {/* HINGLISH: CONNECTLY Logo section */}
      <div className="px-6 py-7 flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg, #7C3AED, #EC4899)' }}>
          <span className="text-white font-black text-sm">C</span>
        </div>
        <span className="text-xl font-black gradient-text">CONNECTLY</span>
      </div>

      {/* HINGLISH: Notification panel overlaid on sidebar */}
      {showNotification && (
        <div className="flex-1 overflow-auto">
          <div className="px-4 py-2 flex items-center justify-between mb-2">
            <span className="text-white font-semibold">Notifications</span>
            <button className="text-gray-400 hover:text-white text-sm" onClick={() => setShowNotification(false)}>✕</button>
          </div>
          <Notifications compact />
        </div>
      )}

      {/* HINGLISH: Nav items list */}
      {!showNotification && (
        <nav className="flex-1 px-4 flex flex-col gap-1 mt-2">
          {navItems.map((item) => (
            <button
              key={item.label}
              onClick={() => {
                if (item.action) {
                  item.action()
                } else {
                  navigate(item.path)
                }
              }}
              className="flex items-center gap-3 px-4 py-3 rounded-2xl w-full text-left transition-all duration-200 group relative"
              style={{
                background: isActive(item.path) ? 'linear-gradient(135deg, rgba(124,58,237,0.2), rgba(236,72,153,0.1))' : 'transparent',
                color: isActive(item.path) ? '#ffffff' : '#9CA3AF',
                border: isActive(item.path) ? '1px solid rgba(124,58,237,0.3)' : '1px solid transparent',
              }}
            >
              {/* HINGLISH: Active left border indicator */}
              {isActive(item.path) && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-full"
                  style={{ background: 'linear-gradient(135deg, #7C3AED, #EC4899)' }} />
              )}
              <span className={`transition-colors ${isActive(item.path) ? 'text-white' : 'text-gray-400 group-hover:text-white'}`}>
                {item.icon}
              </span>
              <span className={`font-medium text-sm transition-colors ${isActive(item.path) ? 'text-white' : 'group-hover:text-white'}`}>
                {item.label}
              </span>
            </button>
          ))}

          {/* HINGLISH: Upload/Create button — gradient special button */}
          <button
            onClick={() => navigate('/upload')}
            className="flex items-center gap-3 px-4 py-3 rounded-2xl w-full mt-2 btn-gradient transition-all"
          >
            <FiPlusSquare size={22} />
            <span className="font-semibold text-sm">Create Post</span>
          </button>
        </nav>
      )}

      {/* HINGLISH: User profile section at bottom of sidebar */}
      {!showNotification && (
        <div className="p-4 border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          <div className="flex items-center gap-3 p-3 rounded-2xl cursor-pointer hover:bg-white/5 transition-colors"
            onClick={() => navigate(`/profile/${userData?.userName}`)}>
            {/* HINGLISH: User avatar with gradient ring */}
            <div className="story-ring-active flex-shrink-0">
              <div className="w-10 h-10 rounded-full overflow-hidden"
                style={{ background: '#0D1117' }}>
                <img src={userData?.profileImage || dp} alt="" className="w-full h-full object-cover" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-white truncate">{userData?.userName}</div>
              <div className="text-xs text-gray-500 truncate">{userData?.name}</div>
            </div>
            <button
              className="text-gray-500 hover:text-red-400 transition-colors p-1"
              onClick={(e) => { e.stopPropagation(); handleLogOut() }}
              title="Log out"
            >
              <MdOutlineLogout size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default LeftHome