import React, { useEffect, useRef, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import {
  FiArrowLeft,
  FiMoreHorizontal,
  FiSmile,
  FiCornerUpLeft,
  FiEdit2,
  FiTrash2,
  FiInfo,
  FiCheck,
  FiSend,
  FiImage,
  FiGrid
} from 'react-icons/fi'
import { GoSearch } from 'react-icons/go'
import dp from "../assets/dp.webp"
import axiosInstance from '../lib/axiosInstance'
import { setMessages, setSelectedUser, setPrevChatUsers } from '../redux/messageSlice'
import { useSocket } from '../context/SocketContext'
import Layout from '../components/layout/Layout'
import { motion, AnimatePresence } from 'framer-motion'
import { useIsMobile } from '../hooks/useCustom'
import { formatTime } from '../utils/formatters'

// Emojis list for message reactions
const EMOJI_OPTIONS = ["❤️", "👍", "😂", "😮", "😢", "🙏"]

function Messages() {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const isMobile = useIsMobile()

  const { userData } = useSelector(state => state.user)
  const { onlineUsers } = useSelector(state => state.socket)
  const { selectedUser, messages, prevChatUsers } = useSelector(state => state.message)
  const socket = useSocket()

  const [searchQuery, setSearchQuery] = useState("")
  const [input, setInput] = useState("")
  const [sending, setSending] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const [otherUserTyping, setOtherUserTyping] = useState(false)

  // File sending state
  const [backendFile, setBackendFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [fileType, setFileType] = useState("image") // "image" | "video"

  // Reply message state
  const [replyingToMessage, setReplyingToMessage] = useState(null)

  // Editing message state
  const [editingMessageId, setEditingMessageId] = useState(null)
  const [editText, setEditText] = useState("")

  // Hover reaction overlay state
  const [activeMessageMenuId, setActiveMessageMenuId] = useState(null)
  const [reactionPopoverId, setReactionPopoverId] = useState(null)

  // Details panel toggle (desktop only)
  const [showDetails, setShowDetails] = useState(false)

  const messagesEndRef = useRef()
  const fileInputRef = useRef()
  const typingTimeoutRef = useRef(null)

  // Refs for socket handlers to prevent stale closure issues
  const messagesRef = useRef(messages)
  const selectedUserRef = useRef(selectedUser)

  useEffect(() => {
    messagesRef.current = messages
  }, [messages])

  useEffect(() => {
    selectedUserRef.current = selectedUser
    setReplyingToMessage(null)
    setEditingMessageId(null)
    setOtherUserTyping(false)
  }, [selectedUser])

  // Fetch conversations list on mount
  const fetchPrevChats = async () => {
    try {
      const result = await axiosInstance.get("/api/message/prevChats")
      dispatch(setPrevChatUsers(result.data || []))
    } catch (err) {
      console.error("fetchPrevChats error:", err)
    }
  }

  // Fetch messages for selected conversation
  const getAllMessages = async () => {
    if (!selectedUser?._id) return
    try {
      const result = await axiosInstance.get(`/api/message/getAll/${selectedUser._id}`)
      dispatch(setMessages(result.data || []))

      // Mark as seen
      await axiosInstance.put(`/api/message/seen/${selectedUser._id}`)
      
      // Explicitly fetch prevChats after marking as read to sync badge states
      const prevChatsRes = await axiosInstance.get("/api/message/prevChats")
      dispatch(setPrevChatUsers(prevChatsRes.data || []))
    } catch (error) {
      console.error("getAllMessages error:", error)
    }
  }

  useEffect(() => {
    fetchPrevChats()
    return () => {
      dispatch(setSelectedUser(null))
    }
  }, [dispatch])

  useEffect(() => {
    getAllMessages()
  }, [selectedUser?._id])

  // Socket listener registration
  useEffect(() => {
    if (!socket) return

    // Removed local handleNewMessage since it is now globally handled in App.jsx

    const handleMessagesSeen = ({ viewerId }) => {
      // If the viewer is the currently active user, mark our sent messages as seen
      if (selectedUserRef.current && viewerId?.toString() === selectedUserRef.current._id?.toString()) {
        const updated = messagesRef.current.map(m =>
          m.sender === userData._id || m.sender?._id === userData._id
            ? { ...m, seen: true }
            : m
        )
        dispatch(setMessages(updated))
      }
    }

    const handleMessageReaction = ({ messageId, reactions }) => {
      const updated = messagesRef.current.map(m =>
        m._id === messageId ? { ...m, reactions } : m
      )
      dispatch(setMessages(updated))
    }

    const handleMessageEdited = ({ messageId, message, isEdited }) => {
      const updated = messagesRef.current.map(m =>
        m._id === messageId ? { ...m, message, isEdited } : m
      )
      dispatch(setMessages(updated))
    }

    const handleMessageDeleted = ({ messageId, isDeleted }) => {
      const updated = messagesRef.current.map(m =>
        m._id === messageId ? { ...m, message: "This message was deleted", image: undefined, video: undefined, isDeleted } : m
      )
      dispatch(setMessages(updated))
    }

    const handleTyping = ({ senderId }) => {
      if (selectedUserRef.current && senderId?.toString() === selectedUserRef.current._id?.toString()) {
        setOtherUserTyping(true)
      }
    }

    const handleStopTyping = ({ senderId }) => {
      if (selectedUserRef.current && senderId?.toString() === selectedUserRef.current._id?.toString()) {
        setOtherUserTyping(false)
      }
    }

    socket.on("messagesSeen", handleMessagesSeen)
    socket.on("messageReaction", handleMessageReaction)
    socket.on("messageEdited", handleMessageEdited)
    socket.on("messageDeleted", handleMessageDeleted)
    socket.on("typing", handleTyping)
    socket.on("stopTyping", handleStopTyping)

    return () => {
      socket.off("messagesSeen", handleMessagesSeen)
      socket.off("messageReaction", handleMessageReaction)
      socket.off("messageEdited", handleMessageEdited)
      socket.off("messageDeleted", handleMessageDeleted)
      socket.off("typing", handleTyping)
      socket.off("stopTyping", handleStopTyping)
    }
  }, [socket, dispatch])

  // Scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, otherUserTyping])

  // Handle file choice (image/video)
  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (!file) return

    setBackendFile(file)
    setPreviewUrl(URL.createObjectURL(file))
    setFileType(file.type.startsWith("video/") ? "video" : "image")
  }

  // Handle typing triggers
  const handleInputChange = (e) => {
    setInput(e.target.value)

    if (!socket || !selectedUser?._id) return

    if (!isTyping) {
      setIsTyping(true)
      socket.emit("typing", { receiverId: selectedUser._id })
    }

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)

    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false)
      socket.emit("stopTyping", { receiverId: selectedUser._id })
    }, 2000)
  }

  // Send message
  const handleSendMessage = async (e) => {
    e.preventDefault()
    if (!input.trim() && !backendFile) return

    setSending(true)

    // Stop typing indicator instantly
    if (isTyping) {
      setIsTyping(false)
      socket?.emit("stopTyping", { receiverId: selectedUser._id })
    }

    try {
      const formData = new FormData()
      formData.append("message", input)
      if (backendFile) {
        formData.append("image", backendFile) // Multer parses file key
      }
      if (replyingToMessage) {
        formData.append("replyTo", replyingToMessage._id)
      }

      const result = await axiosInstance.post(
        `/api/message/send/${selectedUser._id}`,
        formData
      )

      dispatch(setMessages([...messages, result.data]))
      setInput("")
      setBackendFile(null)
      setPreviewUrl(null)
      setReplyingToMessage(null)
      fetchPrevChats() // Refresh sidebar list order
    } catch (err) {
      console.error("send message error:", err)
    } finally {
      setSending(false)
    }
  }

  // Toggle reactions
  const handleToggleReaction = async (messageId, emoji) => {
    try {
      const result = await axiosInstance.post(`/api/message/reaction/${messageId}`, { emoji })
      const updated = messages.map(m => m._id === messageId ? result.data : m)
      dispatch(setMessages(updated))
      setReactionPopoverId(null)
    } catch (err) {
      console.error("toggleReaction error:", err)
    }
  }

  // Edit Message
  const handleSaveEdit = async (messageId) => {
    if (!editText.trim()) return
    try {
      const result = await axiosInstance.put(`/api/message/edit/${messageId}`, { message: editText })
      const updated = messages.map(m => m._id === messageId ? result.data : m)
      dispatch(setMessages(updated))
      setEditingMessageId(null)
      setEditText("")
    } catch (err) {
      console.error("editMessage error:", err)
    }
  }

  // Delete Message
  const handleDeleteMessage = async (messageId) => {
    if (!window.confirm("Are you sure you want to delete this message?")) return
    try {
      const result = await axiosInstance.delete(`/api/message/delete/${messageId}`)
      const updated = messages.map(m => m._id === messageId ? result.data : m)
      dispatch(setMessages(updated))
      setActiveMessageMenuId(null)
    } catch (err) {
      console.error("deleteMessage error:", err)
    }
  }

  // Filter conversations list based on search query
  const filteredChats = prevChatUsers?.filter(chat =>
    chat.user?.userName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    chat.user?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || []

  // Horizontal list of online followed users
  const onlineFollowed = userData?.following?.filter(u => onlineUsers?.includes(u._id)) || []

  // Shared media list (for Details sidebar)
  const sharedMedia = messages.filter(m => m.image || m.video)

  return (
    <Layout>
      <div className="flex h-full bg-[#000000] text-white overflow-hidden relative">

        {/* Left Panel: Conversation list (shown on desktop, or on mobile when selectedUser is null) */}
        {(!isMobile || !selectedUser) && (
          <div className="w-full md:w-[350px] border-r border-[#262626] h-full flex flex-col flex-shrink-0">
            {/* Header */}
            <div className="p-5 border-b border-[#262626] flex-shrink-0 space-y-4">
              <div className="flex items-center justify-between">
                <h1 className="text-xl font-bold tracking-tight">Messages</h1>
                <div className="w-8 h-8 rounded-full bg-[#121212] flex items-center justify-center text-xs border border-[#262626] text-gray-400">
                  {prevChatUsers?.length || 0}
                </div>
              </div>

              {/* Search */}
              <div className="flex items-center gap-2.5 px-3.5 h-9 bg-[#121212] border border-[#262626] rounded-xl text-gray-500">
                <GoSearch size={16} />
                <input
                  type="text"
                  placeholder="Search chats..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full text-xs text-white bg-transparent outline-none placeholder:text-gray-600"
                />
              </div>
            </div>

            {/* Online users horizontal row */}
            {onlineFollowed.length > 0 && (
              <div className="px-5 py-3 border-b border-[#121212] overflow-x-auto flex-shrink-0 flex gap-4 scrollbar-none">
                {onlineFollowed.map(u => (
                  <div
                    key={u._id}
                    onClick={() => dispatch(setSelectedUser(u))}
                    className="flex flex-col items-center gap-1 cursor-pointer hover:scale-105 transition-all flex-shrink-0"
                  >
                    <div className="relative">
                      <img src={u.profileImage || dp} alt="" className="w-11 h-11 rounded-full object-cover border-2 border-green-500 p-0.5" />
                      <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-black rounded-full" />
                    </div>
                    <span className="text-[10px] text-gray-400 truncate w-12 text-center">{u.userName}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Conversations list */}
            <div className="flex-1 overflow-y-auto">
              {filteredChats.length > 0 ? (
                <div className="divide-y divide-[#121212]">
                  {filteredChats.map((chat) => {
                    const chatUser = chat.user
                    const isOnline = onlineUsers?.includes(chatUser._id)
                    const isSelected = selectedUser?._id === chatUser._id
                    return (
                      <div
                        key={chatUser._id}
                        onClick={() => dispatch(setSelectedUser(chatUser))}
                        className={`flex items-center gap-3.5 p-4 cursor-pointer transition-all border-l-2 ${isSelected ? "bg-[#1a1a1a] border-purple-500" : "hover:bg-[#121212]/50 border-transparent"
                          }`}
                      >
                        <div className="relative flex-shrink-0">
                          <img
                            src={chatUser.profileImage || dp}
                            alt=""
                            className="w-12 h-12 rounded-full object-cover bg-neutral-900"
                          />
                          {isOnline && (
                            <span className="absolute bottom-0.5 right-0.5 w-3 h-3 bg-green-500 border-2 border-black rounded-full" />
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-semibold truncate text-white">{chatUser.userName}</span>
                            <span className="text-[10px] text-gray-500">
                              {chat.lastMessageTimestamp ? formatTime(chat.lastMessageTimestamp) : ""}
                            </span>
                          </div>
                          <div className="flex items-center justify-between mt-0.5">
                            <p className={`text-xs truncate mr-2 ${chat.unreadCount > 0 ? "text-white font-bold" : "text-gray-400"}`}>
                              {chat.lastMessageSender === userData._id ? "You: " : ""}
                              {chat.lastMessage || (chat.lastMessageMedia ? `Sent a ${chat.lastMessageMedia}` : (isOnline ? "Online now" : "Offline"))}
                            </p>
                            {chat.unreadCount > 0 && (
                              <span className="bg-blue-500 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full flex-shrink-0">
                                {chat.unreadCount}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center py-20 px-6 text-gray-500">
                  <p className="text-sm">No chats found</p>
                  <p className="text-xs mt-1">Select a creator from recommendations or profile to chat!</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Middle Panel: Active Conversation Thread */}
        {selectedUser ? (
          <div className="flex-1 h-full flex flex-col bg-[#000000] relative">
            {/* Header */}
            <div className="h-16 px-4 border-b border-[#262626] flex items-center justify-between flex-shrink-0 sticky top-0 bg-[#000000]/90 backdrop-blur-md z-30">
              <div className="flex items-center gap-3">
                {isMobile && (
                  <button
                    onClick={() => dispatch(setSelectedUser(null))}
                    className="flex items-center gap-1 text-gray-400 hover:text-white mr-2"
                  >
                    <FiArrowLeft size={20} />
                    <span className="text-xs font-semibold">Back</span>
                  </button>
                )}
                <img
                  src={selectedUser.profileImage || dp}
                  alt=""
                  className="w-9 h-9 rounded-full object-cover cursor-pointer"
                  onClick={() => navigate(`/profile/${selectedUser.userName}`)}
                />
                <div>
                  <h2
                    className="text-sm font-bold hover:underline cursor-pointer"
                    onClick={() => navigate(`/profile/${selectedUser.userName}`)}
                  >
                    {selectedUser.userName}
                  </h2>
                  <p className="text-[10px] text-gray-400">
                    {onlineUsers?.includes(selectedUser._id) ? "Active now" : "Offline"}
                  </p>
                </div>
              </div>

              {/* Action: Info Details Trigger */}
              <button
                onClick={() => setShowDetails(!showDetails)}
                className={`p-2 rounded-full transition-all ${showDetails ? "bg-[#262626] text-white" : "text-gray-400 hover:text-white"}`}
              >
                <FiInfo size={20} />
              </button>
            </div>

            {/* Messages Thread Container */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <AnimatePresence initial={false}>
                {messages?.map((msg) => {
                  const isOwn = msg.sender === userData._id || msg.sender?._id === userData._id
                  const isMenuOpen = activeMessageMenuId === msg._id
                  const isEdited = msg.isEdited
                  const isDeleted = msg.isDeleted

                  return (
                    <motion.div
                      key={msg._id}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex flex-col ${isOwn ? "items-end" : "items-start"} relative group`}
                    >
                      {/* Replying-to label inside bubble */}
                      {msg.replyTo && (
                        <div className="text-[10px] text-gray-500 mb-0.5 flex items-center gap-1">
                          <FiCornerUpLeft size={10} />
                          Replying to {msg.replyTo.sender === userData._id ? "yourself" : selectedUser.userName}
                        </div>
                      )}

                      <div className={`flex items-center gap-2 max-w-[70%] group`}>
                        {/* Hover menu - Left of own message, Right of received message */}
                        {isOwn && !isDeleted && (
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 flex-shrink-0">
                            <button
                              onClick={() => {
                                setReplyingToMessage(msg)
                                fileInputRef.current.focus()
                              }}
                              title="Reply"
                              className="p-1 hover:bg-[#262626] rounded-full text-gray-400 hover:text-white text-xs"
                            >
                              <FiCornerUpLeft size={14} />
                            </button>
                            <button
                              onClick={() => {
                                setEditingMessageId(msg._id)
                                setEditText(msg.message)
                              }}
                              title="Edit"
                              className="p-1 hover:bg-[#262626] rounded-full text-gray-400 hover:text-white text-xs"
                            >
                              <FiEdit2 size={14} />
                            </button>
                            <button
                              onClick={() => handleDeleteMessage(msg._id)}
                              title="Delete"
                              className="p-1 hover:bg-red-950/40 rounded-full text-red-500 text-xs"
                            >
                              <FiTrash2 size={14} />
                            </button>
                            <button
                              onClick={() => setReactionPopoverId(reactionPopoverId === msg._id ? null : msg._id)}
                              title="React"
                              className="p-1 hover:bg-[#262626] rounded-full text-gray-400 hover:text-white text-xs"
                            >
                              <FiSmile size={14} />
                            </button>
                          </div>
                        )}

                        {/* Message Bubble */}
                        <div
                          onDoubleClick={() => handleToggleReaction(msg._id, "❤️")}
                          className={`rounded-2xl px-4 py-2.5 text-sm select-none relative break-words shadow-md transition-all ${isOwn
                              ? "bg-gradient-to-br from-purple-600 to-indigo-600 text-white rounded-br-none"
                              : "bg-[#1e1e1e] text-white rounded-bl-none border border-[#2d2d2d]"
                            }`}
                        >
                          {/* Reply Quote preview inside bubble */}
                          {msg.replyTo && (
                            <div className="bg-black/35 border-l-2 border-purple-400 px-2.5 py-1 mb-2 rounded text-[11px] text-gray-300 max-w-full truncate">
                              <span className="font-bold text-gray-400 block text-[9px]">
                                {msg.replyTo.sender === userData._id ? "You" : selectedUser.userName}
                              </span>
                              {msg.replyTo.message || "Media message"}
                            </div>
                          )}

                          {/* Image rendering */}
                          {msg.image && (
                            <div className="mb-2 max-w-sm rounded-lg overflow-hidden border border-[#2d2d2d]">
                              <img src={msg.image} alt="Shared media" className="w-full object-cover max-h-60" />
                            </div>
                          )}

                          {/* Video rendering */}
                          {msg.video && (
                            <div className="mb-2 max-w-sm rounded-lg overflow-hidden border border-[#2d2d2d]">
                              <video src={msg.video} controls className="w-full max-h-60" />
                            </div>
                          )}

                          {/* Shared Post Card inside bubble */}
                          {msg.sharedPost && (
                            <div
                              onClick={() => navigate(`/profile/${msg.sharedPost.author?.userName || ''}`)}
                              className="cursor-pointer border border-[#262626] bg-[#121212] rounded-lg p-2.5 max-w-[240px] mt-1 space-y-2 hover:bg-[#1a1a1a] transition-all text-left"
                            >
                              <div className="flex items-center gap-2">
                                <img src={msg.sharedPost.author?.profileImage || dp} alt="" className="w-5 h-5 rounded-full object-cover" />
                                <span className="text-[11px] font-bold text-gray-300">{msg.sharedPost.author?.userName}</span>
                              </div>
                              <img src={msg.sharedPost.media} alt="" className="w-full h-32 object-cover rounded" />
                              <p className="text-[10px] text-gray-400 line-clamp-2">{msg.sharedPost.caption}</p>
                            </div>
                          )}

                          {/* Inline Edit mode */}
                          {editingMessageId === msg._id ? (
                            <div className="flex flex-col gap-2 min-w-[150px] mt-1">
                              <input
                                type="text"
                                value={editText}
                                onChange={(e) => setEditText(e.target.value)}
                                className="bg-black/50 text-white text-xs px-2 py-1 rounded outline-none border border-white/20"
                                autoFocus
                              />
                              <div className="flex justify-end gap-1.5">
                                <button
                                  onClick={() => setEditingMessageId(null)}
                                  className="text-[10px] bg-[#262626] hover:bg-[#333] px-2 py-1 rounded font-semibold text-gray-300"
                                >
                                  Cancel
                                </button>
                                <button
                                  onClick={() => handleSaveEdit(msg._id)}
                                  className="text-[10px] bg-blue-600 hover:bg-blue-700 px-2.5 py-1 rounded font-semibold"
                                >
                                  Save
                                </button>
                              </div>
                            </div>
                          ) : (
                            <p className={isDeleted ? "text-gray-500 italic text-xs" : "leading-relaxed"}>
                              {msg.message}
                            </p>
                          )}

                          {/* Reactions pills */}
                          {msg.reactions && msg.reactions.length > 0 && (
                            <div className={`absolute -bottom-2 flex gap-0.5 bg-[#262626] border border-[#3c3c3c] px-1.5 py-0.5 rounded-full z-10 ${isOwn ? 'left-2' : 'right-2'}`}>
                              {msg.reactions.map((reaction, rIdx) => (
                                <span key={rIdx} title={reaction.user?.userName} className="text-xs">
                                  {reaction.emoji}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Received message hover triggers */}
                        {!isOwn && !isDeleted && (
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 flex-shrink-0">
                            <button
                              onClick={() => setReactionPopoverId(reactionPopoverId === msg._id ? null : msg._id)}
                              className="p-1 hover:bg-[#262626] rounded-full text-gray-400 hover:text-white"
                            >
                              <FiSmile size={14} />
                            </button>
                            <button
                              onClick={() => {
                                setReplyingToMessage(msg)
                                fileInputRef.current.focus()
                              }}
                              className="p-1 hover:bg-[#262626] rounded-full text-gray-400 hover:text-white"
                            >
                              <FiCornerUpLeft size={14} />
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Reactions Popover */}
                      {reactionPopoverId === msg._id && (
                        <div className={`absolute bottom-full mb-1 z-50 bg-[#1e1e1e] border border-[#2d2d2d] p-1.5 rounded-full flex gap-2 shadow-xl ${isOwn ? 'right-0' : 'left-0'}`}>
                          {EMOJI_OPTIONS.map(emoji => (
                            <button
                              key={emoji}
                              onClick={() => handleToggleReaction(msg._id, emoji)}
                              className="hover:scale-125 transition-transform text-sm"
                            >
                              {emoji}
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Seen / Edited receipts */}
                      <div className="flex items-center gap-1.5 mt-1">
                        {isEdited && <span className="text-[9px] text-gray-500">(edited)</span>}
                        {isOwn && (
                          <span className="text-[10px] text-gray-500 flex items-center gap-0.5">
                            {msg.seen ? (
                              <span className="text-blue-400 text-[9px] font-semibold">Seen</span>
                            ) : (
                              <FiCheck size={10} className="text-gray-600" />
                            )}
                          </span>
                        )}
                      </div>
                    </motion.div>
                  )
                })}
              </AnimatePresence>

              {/* Typing animation bubble */}
              {otherUserTyping && (
                <div className="flex items-center gap-2 text-xs text-gray-500 italic px-4 py-1">
                  <div className="flex gap-1.5">
                    <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                  <span>{selectedUser.userName} is typing...</span>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input & Upload Form */}
            <div className="border-t border-[#262626] p-4 bg-[#000000] flex-shrink-0">

              {/* Media Send Preview */}
              {previewUrl && (
                <div className="relative inline-block mb-3 bg-[#121212] p-1 rounded-xl border border-[#262626]">
                  {fileType === "video" ? (
                    <video src={previewUrl} className="h-20 w-32 rounded-lg object-cover" muted />
                  ) : (
                    <img src={previewUrl} alt="Preview" className="h-20 w-20 rounded-lg object-cover" />
                  )}
                  <button
                    onClick={() => {
                      setPreviewUrl(null)
                      setBackendFile(null)
                    }}
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-[10px] font-bold"
                  >
                    ✕
                  </button>
                </div>
              )}

              {/* Replying-to label */}
              {replyingToMessage && (
                <div className="flex items-center justify-between px-3 py-1.5 bg-[#121212] border border-[#262626] rounded-lg text-xs mb-3 text-gray-300">
                  <div className="truncate">
                    <span className="font-semibold text-purple-400">Replying to {replyingToMessage.sender === userData._id ? "yourself" : selectedUser.userName}:</span>
                    <span className="ml-1 text-gray-400">{replyingToMessage.message || "Attachment"}</span>
                  </div>
                  <button className="text-gray-400 hover:text-white" onClick={() => setReplyingToMessage(null)}>✕</button>
                </div>
              )}

              {/* Send Form */}
              <form onSubmit={handleSendMessage} className="flex items-center gap-3">
                <input
                  type="file"
                  accept="image/*,video/*"
                  hidden
                  ref={fileInputRef}
                  onChange={handleFileChange}
                />

                <button
                  type="button"
                  onClick={() => fileInputRef.current.click()}
                  className="p-2 bg-[#121212] border border-[#262626] hover:bg-[#1e1e1e] rounded-full text-gray-400 hover:text-white transition-colors"
                >
                  <FiImage size={18} />
                </button>

                <input
                  type="text"
                  placeholder="Message..."
                  value={input}
                  onChange={handleInputChange}
                  className="flex-1 bg-[#121212] border border-[#262626] rounded-full px-5 py-2.5 text-xs text-white outline-none focus:border-[#4d4d4d] placeholder:text-neutral-600"
                />

                {(input.trim() || backendFile) && (
                  <button
                    type="submit"
                    disabled={sending}
                    className="p-2.5 bg-blue-500 hover:bg-blue-600 rounded-full text-white transition-all flex items-center justify-center disabled:bg-neutral-800 disabled:text-neutral-600"
                  >
                    <FiSend size={16} />
                  </button>
                )}
              </form>
            </div>
          </div>
        ) : (
          /* Desktop Right panel default placeholder */
          !isMobile && (
            <div className="flex-1 h-full flex flex-col items-center justify-center bg-[#000000] text-center p-8">
              <div className="w-24 h-24 rounded-full border border-[#262626] flex items-center justify-center text-gray-500 mb-6 bg-[#121212]">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
              </div>
              <h2 className="text-xl font-bold">Your Messages</h2>
              <p className="text-sm text-gray-500 mt-2 max-w-sm">
                Send private photos and messages to a friend or group. Start the conversation from recommended creators.
              </p>
            </div>
          )
        )}

        {/* Right Details Panel: Profile Info & Shared Gallery (visible when toggled and user is selected) */}
        {!isMobile && selectedUser && showDetails && (
          <div className="w-[280px] border-l border-[#262626] h-full bg-[#000000] flex flex-col flex-shrink-0 z-20">
            {/* Header */}
            <div className="p-5 border-b border-[#262626] text-center flex flex-col items-center gap-3">
              <img
                src={selectedUser.profileImage || dp}
                alt=""
                className="w-20 h-20 rounded-full object-cover border-2 border-purple-500/30 p-0.5 cursor-pointer"
                onClick={() => navigate(`/profile/${selectedUser.userName}`)}
              />
              <div>
                <h3
                  className="font-bold text-sm hover:underline cursor-pointer"
                  onClick={() => navigate(`/profile/${selectedUser.userName}`)}
                >
                  {selectedUser.name}
                </h3>
                <p className="text-xs text-gray-500">@{selectedUser.userName}</p>
              </div>
            </div>

            {/* Gallery grid of shared attachments */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
                <FiGrid size={12} />
                Shared Attachments
              </h4>
              {sharedMedia.length > 0 ? (
                <div className="grid grid-cols-3 gap-1">
                  {sharedMedia.map((m, idx) => (
                    <div
                      key={m._id || idx}
                      className="aspect-square bg-neutral-900 rounded overflow-hidden cursor-pointer hover:opacity-85 transition-opacity"
                    >
                      {m.image ? (
                        <img src={m.image} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <video src={m.video} className="w-full h-full object-cover" muted />
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-500 italic">No media shared in this chat yet</p>
              )}
            </div>
          </div>
        )}

      </div>
    </Layout>
  )
}

export default Messages
