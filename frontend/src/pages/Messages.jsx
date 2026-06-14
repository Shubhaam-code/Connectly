import React from 'react'
import { useNavigate } from 'react-router-dom'
import { MdOutlineKeyboardBackspace } from 'react-icons/md'
import { GoSearch } from 'react-icons/go'
import { useDispatch, useSelector } from 'react-redux'
import { setSelectedUser } from '../redux/messageSlice'
import dp from '../assets/dp.webp'
import Nav from '../components/Nav'

// HINGLISH: Messages page — chat list with online users + previous conversations
function Messages() {
  const navigate = useNavigate()
  const { userData } = useSelector(state => state.user)
  const { onlineUsers } = useSelector(state => state.socket)
  const { prevChatUsers } = useSelector(state => state.message)
  const dispatch = useDispatch()

  return (
    <div className="w-full min-h-screen pb-24 lg:pb-0" style={{ background: '#0D1117' }}>

      {/* HINGLISH: Header — Chats title + edit/compose icon */}
      <div className="sticky top-0 z-40 px-5 py-4"
        style={{ background: 'rgba(13,17,23,0.95)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <button className="lg:hidden text-gray-400 hover:text-white"
              onClick={() => navigate('/')}>
              <MdOutlineKeyboardBackspace size={22} />
            </button>
            <h1 className="text-xl font-bold text-white">Chats</h1>
          </div>
          {/* HINGLISH: Compose new message icon */}
          <button className="w-9 h-9 rounded-full flex items-center justify-center hover-scale"
            style={{ background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.2)' }}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#7C3AED" strokeWidth="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
          </button>
        </div>

        {/* HINGLISH: Search bar */}
        <div className="flex items-center gap-3 px-4 h-[42px] rounded-2xl"
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <GoSearch className="text-gray-500" size={16} />
          <input
            type="text"
            placeholder="Search messages..."
            className="w-full text-sm text-white bg-transparent outline-none placeholder:text-gray-600"
          />
        </div>
      </div>

      {/* HINGLISH: Online users row — following me se jo online hain */}
      <div className="px-5 py-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
        <div className="flex gap-4 overflow-x-auto pb-1">
          {userData?.following?.filter(user => onlineUsers?.includes(user._id)).map((user, index) => (
            <div key={index}
              className="flex flex-col items-center gap-1.5 cursor-pointer hover-scale"
              onClick={() => { dispatch(setSelectedUser(user)); navigate('/messageArea') }}>
              {/* HINGLISH: Online indicator ring */}
              <div className="relative">
                <div className="w-14 h-14 rounded-full overflow-hidden"
                  style={{ border: '2px solid #10B981' }}>
                  <img src={user.profileImage || dp} alt="" className="w-full h-full object-cover" />
                </div>
                <div className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2"
                  style={{ background: '#10B981', borderColor: '#0D1117' }} />
              </div>
              <span className="text-xs text-white truncate w-14 text-center">{user.userName}</span>
            </div>
          ))}
          {userData?.following?.filter(user => onlineUsers?.includes(user._id)).length === 0 && (
            <p className="text-sm" style={{ color: '#6B7280' }}>No one online right now</p>
          )}
        </div>
      </div>

      {/* HINGLISH: Previous chat users list */}
      <div className="flex flex-col px-4 pt-3">
        {prevChatUsers?.length === 0 && (
          <div className="text-center py-16">
            <div className="text-4xl mb-3">💬</div>
            <p className="text-white font-semibold">No conversations yet</p>
            <p className="text-sm mt-2" style={{ color: '#6B7280' }}>Start a chat with someone you follow</p>
          </div>
        )}

        {prevChatUsers?.map((user, index) => {
          const isOnline = onlineUsers?.includes(user._id)
          return (
            <div key={index}
              className="flex items-center gap-3 p-3 rounded-2xl cursor-pointer hover:bg-white/5 transition-all"
              onClick={() => { dispatch(setSelectedUser(user)); navigate('/messageArea') }}>

              {/* HINGLISH: User avatar with online indicator */}
              <div className="relative flex-shrink-0">
                <div className="w-12 h-12 rounded-full overflow-hidden"
                  style={{ border: isOnline ? '2px solid #10B981' : '2px solid rgba(255,255,255,0.1)' }}>
                  <img src={user.profileImage || dp} alt="" className="w-full h-full object-cover" />
                </div>
                {isOnline && (
                  <div className="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2"
                    style={{ background: '#10B981', borderColor: '#0D1117' }} />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-white">{user.userName}</span>
                  <span className="text-xs" style={{ color: '#6B7280' }}>Just now</span>
                </div>
                <div className="text-xs truncate mt-0.5"
                  style={{ color: isOnline ? '#10B981' : '#6B7280' }}>
                  {isOnline ? 'Active Now' : 'Tap to chat...'}
                </div>
              </div>

              {/* HINGLISH: Unread message indicator (UI only) */}
              {index % 3 === 0 && (
                <div className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0"
                  style={{ background: 'linear-gradient(135deg, #7C3AED, #EC4899)' }}>
                  {Math.floor(Math.random() * 5) + 1}
                </div>
              )}
            </div>
          )
        })}
      </div>

      <Nav />
    </div>
  )
}

export default Messages
