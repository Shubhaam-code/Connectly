import React from 'react'
import { GoHomeFill } from "react-icons/go"
import { FiSearch } from "react-icons/fi"
import { RxVideo } from "react-icons/rx"
import { FiPlusSquare } from "react-icons/fi"
import dp from "../assets/dp.webp"
import { useNavigate, useLocation } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { BiMessageAltDetail } from "react-icons/bi"

// HINGLISH: Bottom navigation bar — mobile ke liye glassmorphism pill nav
function Nav() {
  const navigate = useNavigate()
  const location = useLocation()
  const { userData } = useSelector(state => state.user)

  const isActive = (path) => location.pathname === path

  // HINGLISH: Nav items with their paths
  const navItems = [
    { icon: <GoHomeFill size={24} />, path: '/', label: 'Home' },
    { icon: <FiSearch size={22} />, path: '/search', label: 'Search' },
    { icon: null, path: '/upload', label: 'Create', isSpecial: true },
    { icon: <RxVideo size={22} />, path: '/loops', label: 'Loops' },
    { icon: <BiMessageAltDetail size={22} />, path: '/messages', label: 'Messages' },
  ]

  return (
    // HINGLISH: Glassmorphism pill container — fixed at bottom
    <div className="w-[92%] max-w-[480px] h-[68px] fixed bottom-4 left-1/2 -translate-x-1/2 z-[100] flex items-center justify-around px-4 rounded-full lg:hidden"
      style={{
        background: 'rgba(13, 17, 23, 0.85)',
        backdropFilter: 'blur(30px)',
        WebkitBackdropFilter: 'blur(30px)',
        border: '1px solid rgba(124, 58, 237, 0.25)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.6), 0 0 0 1px rgba(124,58,237,0.1)'
      }}>

      {navItems.map((item) => {
        if (item.isSpecial) {
          // HINGLISH: Center "+" create button — gradient circle
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className="w-12 h-12 rounded-2xl flex items-center justify-center btn-gradient hover-scale"
              style={{ boxShadow: '0 4px 15px rgba(124,58,237,0.5)' }}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
                <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </button>
          )
        }

        const active = isActive(item.path)
        // HINGLISH: Last item = profile photo
        if (item.label === 'Messages') {
          return (
            <button key={item.path} onClick={() => navigate(item.path)} className="flex flex-col items-center gap-1 p-2">
              <span style={{ color: active ? '#7C3AED' : '#6B7280', transition: 'color 0.2s' }}>
                {item.icon}
              </span>
              {active && <div className="nav-active-dot" />}
            </button>
          )
        }

        return (
          <button key={item.path} onClick={() => navigate(item.path)} className="flex flex-col items-center gap-1 p-2">
            <span style={{ color: active ? '#7C3AED' : '#6B7280', transition: 'color 0.2s' }}>
              {item.icon}
            </span>
            {active && <div className="nav-active-dot" />}
          </button>
        )
      })}

      {/* HINGLISH: Profile avatar tab at the end */}
      <button onClick={() => navigate(`/profile/${userData?.userName}`)} className="flex flex-col items-center gap-1 p-1">
        <div className={`w-8 h-8 rounded-full overflow-hidden transition-all ${isActive(`/profile/${userData?.userName}`) ? 'ring-2 ring-purple-500' : 'ring-1 ring-white/20'}`}>
          <img src={userData?.profileImage || dp} alt="" className="w-full h-full object-cover" />
        </div>
        {isActive(`/profile/${userData?.userName}`) && <div className="nav-active-dot" />}
      </button>
    </div>
  )
}

export default Nav
