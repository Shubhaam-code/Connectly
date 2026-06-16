import React from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { GoHomeFill } from "react-icons/go"
import { FiSearch, FiPlusSquare, FiBell, FiMoreHorizontal } from "react-icons/fi"
import { RxVideo } from "react-icons/rx"
import { BiMessageAltDetail } from "react-icons/bi"
import { MdOutlineLogout } from "react-icons/md"
import dp from "../assets/dp.webp"
import axiosInstance from '../lib/axiosInstance'
import { setUserData } from '../redux/userSlice'

function LeftHome() {
  const { userData, notificationData } = useSelector(state => state.user)
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const location = useLocation()

  const unreadCount = notificationData?.filter(n => !n.isRead).length || 0

  const handleLogOut = async () => {
    try {
      await axiosInstance.get("/api/auth/signout")
    } catch (error) {
      console.error("logout error:", error.message)
    }
    dispatch(setUserData(null))
  }

  const navItems = [
    { icon: <GoHomeFill size={24} />, label: 'Home', path: '/' },
    { icon: <RxVideo size={24} />, label: 'Reels', path: '/loops' },
    { icon: <BiMessageAltDetail size={24} />, label: 'Messages', path: '/messages' },
    { icon: <FiSearch size={24} />, label: 'Search', path: '/search' },
    {
      icon: (
        <div className="relative">
          <FiBell size={24} />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full flex items-center justify-center text-[9px] font-bold text-white connectly-badge">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </div>
      ),
      label: 'Notifications',
      path: '/notifications'
    },
    { icon: <FiPlusSquare size={24} />, label: 'Create', path: '/upload' },
    { icon: null, label: 'Profile', path: `/profile/${userData?.userName}`, isProfile: true },
    { icon: <FiMoreHorizontal size={24} />, label: 'More', path: '/settings' },
  ]

  const isActive = (path) => {
    if (path.startsWith('/profile/')) {
      return location.pathname.startsWith('/profile/')
    }
    return location.pathname === path
  }

  return (
    <aside
      className="connectly-sidebar hidden lg:flex flex-col fixed left-0 top-0 z-50 h-screen"
      style={{ width: '240px', background: '#000000', borderRight: '1px solid #262626' }}
    >
      {/* Logo */}
      <div className="px-6 py-6">
        <button onClick={() => navigate('/')} className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center connectly-gradient-bg">
            <span className="text-white font-black text-sm">C</span>
          </div>
          <span className="text-xl font-black connectly-gradient-text tracking-tight">CONNECTLY</span>
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 flex flex-col gap-0.5">
        {navItems.map((item) => (
          <button
            key={item.label}
            onClick={() => navigate(item.path)}
            className="connectly-nav-item flex items-center gap-4 px-3 py-3 rounded-xl w-full text-left transition-all duration-200 group relative"
            style={{
              background: isActive(item.path) ? '#121212' : 'transparent',
              color: isActive(item.path) ? '#FFFFFF' : '#FFFFFF',
            }}
          >
            {isActive(item.path) && (
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-full connectly-gradient-bg" />
            )}
            <span className={`transition-colors ${isActive(item.path) ? 'text-white' : 'text-white/70 group-hover:text-white'}`}>
              {item.isProfile ? (
                <div className={`w-6 h-6 rounded-full overflow-hidden ring-2 ${isActive(item.path) ? 'ring-purple-500' : 'ring-transparent'}`}>
                  <img src={userData?.profileImage || dp} alt="" className="w-full h-full object-cover" />
                </div>
              ) : item.icon}
            </span>
            <span className={`font-normal text-[15px] transition-colors ${isActive(item.path) ? 'font-semibold text-white' : 'text-white/80 group-hover:text-white'}`}>
              {item.label}
            </span>
          </button>
        ))}
      </nav>

      {/* Logout */}
      <div className="p-4" style={{ borderTop: '1px solid #262626' }}>
        <button
          onClick={handleLogOut}
          className="flex items-center gap-4 px-3 py-3 rounded-xl w-full text-left text-white/60 hover:text-red-400 hover:bg-[var(--hover)] transition-all duration-200"
        >
          <MdOutlineLogout size={24} />
          <span className="text-[15px]">Log out</span>
        </button>
      </div>
    </aside>
  )
}

export default LeftHome
