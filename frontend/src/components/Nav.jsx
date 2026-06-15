import React from 'react'
import { GoHomeFill } from "react-icons/go"
import { FiSearch, FiPlusSquare } from "react-icons/fi"
import dp from "../assets/dp.webp"
import { useNavigate, useLocation } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { BiMessageAltDetail } from "react-icons/bi"

function Nav() {
  const navigate = useNavigate()
  const location = useLocation()
  const { userData } = useSelector(state => state.user)

  const isActive = (path) => location.pathname === path
  const profilePath = `/profile/${userData?.userName}`

  const navItems = [
    { icon: <GoHomeFill size={26} />, path: '/', label: 'Home' },
    { icon: <FiSearch size={26} />, path: '/search', label: 'Search' },
    { icon: null, path: '/upload', label: 'Create', isSpecial: true },
    { icon: <BiMessageAltDetail size={26} />, path: '/messages', label: 'Messages' },
    { icon: null, path: profilePath, label: 'Profile', isProfile: true },
  ]

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-[100] lg:hidden flex items-center justify-around px-2 py-2"
      style={{ background: '#000000', borderTop: '1px solid #262626' }}
    >
      {navItems.map((item) => {
        if (item.isSpecial) {
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className="flex flex-col items-center p-2"
              aria-label="Create"
            >
              <div className="w-7 h-7 flex items-center justify-center">
                <FiPlusSquare size={26} color="white" />
              </div>
            </button>
          )
        }

        if (item.isProfile) {
          const active = location.pathname.startsWith('/profile/')
          return (
            <button key={item.path} onClick={() => navigate(item.path)} className="flex flex-col items-center p-2">
              <div className={`w-7 h-7 rounded-full overflow-hidden ${active ? 'ring-2 ring-purple-500' : ''}`}>
                <img src={userData?.profileImage || dp} alt="" className="w-full h-full object-cover" />
              </div>
            </button>
          )
        }

        const active = isActive(item.path)
        return (
          <button key={item.path} onClick={() => navigate(item.path)} className="flex flex-col items-center p-2">
            <span style={{ color: active ? '#FFFFFF' : '#A8A8A8', transition: 'color 0.2s' }}>
              {item.icon}
            </span>
          </button>
        )
      })}
    </nav>
  )
}

export default Nav
