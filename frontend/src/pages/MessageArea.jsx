import React, { useEffect, useRef, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { MdOutlineKeyboardBackspace } from 'react-icons/md'
import { LuImage } from 'react-icons/lu'
import { IoMdSend } from 'react-icons/io'
import dp from "../assets/dp.webp"
import SenderMessage from '../components/SenderMessage'
import ReceiverMessage from '../components/ReceiverMessage'
import axiosInstance from '../lib/axiosInstance'
import { setMessages } from '../redux/messageSlice'
import { useSocket } from '../context/SocketContext'

// HINGLISH: Chat/Message screen — selected user ke saath conversation
function MessageArea() {
  const { selectedUser, messages } = useSelector(state => state.message)
  const { userData } = useSelector(state => state.user)
  // BUG FIX (Issue 4): Read socket from Context, not Redux
  const socketRef = useSocket()
  const navigate = useNavigate()
  const [input, setInput] = useState("")
  const dispatch = useDispatch()
  const imageInput = useRef()
  const messagesEndRef = useRef()
  // BUG FIX (Issue 5): Use a ref to always hold the latest messages value.
  // This prevents the stale closure problem in the socket event handler below.
  const messagesRef = useRef(messages)
  const [frontendImage, setFrontendImage] = useState(null)
  const [backendImage, setBackendImage] = useState(null)
  const [sending, setSending] = useState(false)

  // Keep messagesRef in sync with Redux messages state
  useEffect(() => {
    messagesRef.current = messages
  }, [messages])

  const handleImage = (e) => {
    const file = e.target.files[0]
    // BUG FIX (Issue 2): Guard against undefined/null file.
    // If the user opens the file picker and then cancels, e.target.files[0]
    // is undefined. Calling URL.createObjectURL(undefined) throws:
    // "Failed to execute 'createObjectURL' on 'URL': Overload resolution failed."
    if (!file || !(file instanceof File)) return

    setBackendImage(file)
    setFrontendImage(URL.createObjectURL(file))
  }

  // HINGLISH: Message bhejne ka function — text + optional image
  const handleSendMessage = async (e) => {
    e.preventDefault()
    if (!input.trim() && !backendImage) return
    setSending(true)
    try {
      const formData = new FormData()
      formData.append("message", input)
      if (backendImage) formData.append("image", backendImage)
      const result = await axiosInstance.post(
        `/api/message/send/${selectedUser._id}`,
        formData
      )
      dispatch(setMessages([...messages, result.data]))
      setInput("")
      setBackendImage(null)
      setFrontendImage(null)
    } catch (error) {
      console.error("sendMessage error:", error)
    } finally {
      setSending(false)
    }
  }

  // HINGLISH: Pichle saare messages fetch karna
  const getAllMessages = async () => {
    try {
      const result = await axiosInstance.get(
        `/api/message/getAll/${selectedUser._id}`
      )
      dispatch(setMessages(result.data || []))
    } catch (error) {
      console.error("getAllMessages error:", error)
    }
  }

  useEffect(() => { getAllMessages() }, [])

  // BUG FIX (Issue 5): Fixed stale closure in the newMessage socket handler.
  // Previously the handler captured `messages` at effect-creation time.
  // Now messagesRef.current always points to the latest messages array,
  // so incoming socket messages are appended to the correct current state.
  useEffect(() => {
    const socket = socketRef?.current
    if (!socket) return

    const handleNewMessage = (mess) => {
      dispatch(setMessages([...messagesRef.current, mess]))
    }

    socket.on("newMessage", handleNewMessage)
    return () => socket.off("newMessage", handleNewMessage)
  }, [socketRef?.current, dispatch])

  // HINGLISH: Naya message aane par bottom pe auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  return (
    <div className="w-full h-screen flex flex-col relative" style={{ background: '#0D1117' }}>

      {/* HINGLISH: Chat header — back button, avatar, user info, actions */}
      <div className="flex items-center gap-3 px-4 py-3 flex-shrink-0"
        style={{
          background: 'rgba(13,17,23,0.95)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          position: 'sticky',
          top: 0,
          zIndex: 40
        }}>
        <button className="text-gray-400 hover:text-white transition-colors p-1"
          onClick={() => navigate('/messages')}>
          <MdOutlineKeyboardBackspace size={22} />
        </button>

        {/* HINGLISH: Selected user ka avatar */}
        <div className="story-ring-active cursor-pointer"
          onClick={() => navigate(`/profile/${selectedUser?.userName}`)}>
          <div className="w-10 h-10 rounded-full overflow-hidden" style={{ background: '#0D1117' }}>
            <img src={selectedUser?.profileImage || dp} alt="" className="w-full h-full object-cover" />
          </div>
        </div>

        <div className="flex-1 cursor-pointer" onClick={() => navigate(`/profile/${selectedUser?.userName}`)}>
          <div className="text-sm font-semibold text-white">{selectedUser?.userName}</div>
          <div className="text-xs" style={{ color: '#6B7280' }}>{selectedUser?.name}</div>
        </div>

        {/* HINGLISH: Video call + audio call icons */}
        <div className="flex items-center gap-3">
          <button className="w-9 h-9 rounded-full flex items-center justify-center hover-scale"
            style={{ background: 'rgba(255,255,255,0.05)' }}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.41 2 2 0 0 1 3.6 1.25h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.91 9a16 16 0 0 0 6 6l.91-.91a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 21.88 16z" />
            </svg>
          </button>
          <button className="w-9 h-9 rounded-full flex items-center justify-center hover-scale"
            style={{ background: 'rgba(255,255,255,0.05)' }}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2">
              <polygon points="23 7 16 12 23 17 23 7" /><rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
            </svg>
          </button>
        </div>
      </div>

      {/* HINGLISH: Messages list — scrollable area */}
      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3">
        {messages && messages.map((mess, index) =>
          mess.sender === userData._id
            ? <SenderMessage key={index} message={mess} />
            : <ReceiverMessage key={index} message={mess} />
        )}

        {/* HINGLISH: Disappearing message notice */}
        {messages?.length > 0 && (
          <div className="text-center my-2">
            <span className="text-xs px-3 py-1 rounded-full" style={{ background: 'rgba(255,255,255,0.05)', color: '#6B7280' }}>
              💬 Messages disappear in 24 hours
            </span>
          </div>
        )}

        {/* HINGLISH: Empty state */}
        {(!messages || messages.length === 0) && (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 py-16">
            <div className="w-16 h-16 rounded-full overflow-hidden story-ring-active">
              <img src={selectedUser?.profileImage || dp} alt="" className="w-full h-full object-cover" />
            </div>
            <p className="text-white font-semibold">{selectedUser?.userName}</p>
            <p className="text-sm" style={{ color: '#6B7280' }}>Say hi to start the conversation!</p>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* HINGLISH: Image preview above input */}
      {frontendImage && (
        <div className="px-4 pb-2">
          <div className="relative inline-block">
            <img src={frontendImage} alt="" className="h-16 w-16 rounded-xl object-cover" />
            <button
              className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-white text-xs"
              style={{ background: '#EC4899' }}
              onClick={() => {
                setFrontendImage(null)
                setBackendImage(null)
                // Reset file input so same file can be re-selected
                if (imageInput.current) imageInput.current.value = ""
              }}>
              ✕
            </button>
          </div>
        </div>
      )}

      {/* HINGLISH: Message input bar — bottom mein fixed */}
      <div className="flex-shrink-0 px-4 py-3"
        style={{ background: 'rgba(13,17,23,0.95)', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <form className="flex items-center gap-3" onSubmit={handleSendMessage}>
          <input
            type="file"
            accept="image/*"
            hidden
            ref={imageInput}
            onChange={handleImage}
          />

          <div className="flex-1 flex items-center gap-3 px-4 h-[48px] rounded-full"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <input
              type="text"
              placeholder="Message..."
              className="flex-1 text-sm text-white bg-transparent outline-none placeholder:text-gray-600"
              onChange={(e) => setInput(e.target.value)}
              value={input}
              // BUG FIX (Issue 3): autoFocus on this input is NOT the issue — the
              // focus was being lost because App.jsx re-rendered on every keystroke
              // due to the notification listener being outside useEffect.
              // That is now fixed in App.jsx.
            />
            <button type="button" className="text-gray-500 hover:text-gray-300 transition-colors"
              onClick={() => imageInput.current.click()}>
              <LuImage size={20} />
            </button>
            {/* HINGLISH: Mic icon */}
            <button type="button" className="text-gray-500 hover:text-gray-300 transition-colors">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                <path d="M19 10v2a7 7 0 0 1-14 0v-2" /><line x1="12" y1="19" x2="12" y2="23" />
                <line x1="8" y1="23" x2="16" y2="23" />
              </svg>
            </button>
          </div>

          {/* HINGLISH: Send button — gradient circle */}
          {(input || frontendImage) && (
            <button
              type="submit"
              disabled={sending}
              className="w-12 h-12 rounded-full flex items-center justify-center btn-gradient flex-shrink-0 hover-scale"
              style={{ opacity: sending ? 0.6 : 1 }}>
              <IoMdSend className="text-white" size={20} />
            </button>
          )}
        </form>
      </div>
    </div>
  )
}

export default MessageArea
