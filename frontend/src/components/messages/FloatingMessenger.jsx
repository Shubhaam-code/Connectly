import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { motion, AnimatePresence, useDragControls } from "framer-motion";
import {
  FiMessageCircle,
  FiX,
  FiMinus,
  FiSearch,
  FiSmile,
  FiImage,
  FiSend,
  FiCheck,
  FiCheckCircle
} from "react-icons/fi";
import { useSocket } from "../../context/SocketContext";
import axiosInstance from "../../lib/axiosInstance";
import { setPrevChatUsers } from "../../redux/messageSlice";
import dp from "../../assets/dp.webp";
import { formatTime } from "../../utils/formatters";

export const FloatingMessenger = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const socket = useSocket();
  const { userData } = useSelector((state) => state.user);
  const { prevChatUsers } = useSelector((state) => state.message);

  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const activeChatDragControls = useDragControls();
  const listDragControls = useDragControls();

  const [chatPosition, setChatPosition] = useState(() => {
    const saved = localStorage.getItem("connectly_messenger_pos");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.chat) return parsed.chat;
      } catch (e) {}
    }
    return { x: -350, y: -80 };
  });

  const [listPosition, setListPosition] = useState(() => {
    const saved = localStorage.getItem("connectly_messenger_pos");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.list) return parsed.list;
      } catch (e) {}
    }
    return { x: -350, y: -80 };
  });

  const savePosition = (type, pos) => {
    const saved = localStorage.getItem("connectly_messenger_pos");
    let parsed = {};
    if (saved) {
      try {
        parsed = JSON.parse(saved);
      } catch (e) {}
    }
    parsed[type] = pos;
    localStorage.setItem("connectly_messenger_pos", JSON.stringify(parsed));
  };
  const [activeChat, setActiveChat] = useState(null); // The open floating chat user
  const [chatMessages, setChatMessages] = useState([]);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [isOtherTyping, setIsOtherTyping] = useState(false);
  const [inputText, setInputText] = useState("");
  const [mediaFile, setMediaFile] = useState(null);
  const [mediaPreview, setMediaPreview] = useState("");
  const [onlineUsers, setOnlineUsers] = useState([]);

  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);
  const chatMessagesRef = useRef(chatMessages);

  // Sync ref to prevent stale closures in socket listener
  useEffect(() => {
    chatMessagesRef.current = chatMessages;
  }, [chatMessages]);

  // HINGLISH: Agar main messages page pe hai to launcher hide kar do
  if (location.pathname === "/messages" || !userData) {
    return null;
  }

  // Calculate total unread messages count
  const unreadCount = Array.isArray(prevChatUsers)
    ? prevChatUsers.reduce((sum, chat) => sum + (chat.unreadCount || 0), 0)
    : 0;

  // Load online users
  useEffect(() => {
    if (!socket) return;
    socket.on("getOnlineUsers", (users) => {
      setOnlineUsers(users || []);
    });
    return () => {
      socket.off("getOnlineUsers");
    };
  }, [socket]);

  // Fetch messages when a chat is selected
  useEffect(() => {
    if (!activeChat) return;

    const fetchChatMessages = async () => {
      try {
        const res = await axiosInstance.get(`/api/message/getAll/${activeChat._id}`);
        setChatMessages(res.data || []);
        
        // Mark seen sequentially
        await axiosInstance.put(`/api/message/seen/${activeChat._id}`);
        const prevChatsRes = await axiosInstance.get("/api/message/prevChats");
        dispatch(setPrevChatUsers(prevChatsRes.data || []));
      } catch (err) {
        console.error("Failed to load chat messages:", err);
      }
    };

    fetchChatMessages();
    setIsMinimized(false);
  }, [activeChat, dispatch]);

  // Scroll to bottom helper
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages, isOtherTyping]);

  // Handle incoming messages and typing signals via Socket
  useEffect(() => {
    if (!socket || !userData) return;

    const handleNewMessage = (mess) => {
      const senderIdStr = (mess.sender?._id || mess.sender)?.toString();
      const receiverIdStr = (mess.receiver?._id || mess.receiver)?.toString();
      const currentUserIdStr = userData?._id?.toString();
      const activeChatIdStr = activeChat?._id?.toString();

      const isChattingWithSender = 
        activeChatIdStr && 
        (senderIdStr === activeChatIdStr || (senderIdStr === currentUserIdStr && receiverIdStr === activeChatIdStr));

      if (isChattingWithSender) {
        setChatMessages([...chatMessagesRef.current, mess]);
        // Auto seen
        axiosInstance.put(`/api/message/seen/${activeChatIdStr}`)
          .then(() => axiosInstance.get("/api/message/prevChats"))
          .then((res) => dispatch(setPrevChatUsers(res.data || [])))
          .catch((err) => console.error("Error auto-seen in floating messenger:", err));
      }
    };

    const handleTyping = ({ senderId }) => {
      if (activeChat?._id?.toString() === senderId?.toString()) {
        setIsOtherTyping(true);
      }
    };

    const handleStopTyping = ({ senderId }) => {
      if (activeChat?._id?.toString() === senderId?.toString()) {
        setIsOtherTyping(false);
      }
    };

    const handleMessagesSeen = ({ conversationId }) => {
      // Refresh messages status
      if (activeChat) {
        axiosInstance.get(`/api/message/getAll/${activeChat._id}`)
          .then((res) => setChatMessages(res.data || []))
          .catch((err) => console.error(err));
      }
    };

    socket.on("newMessage", handleNewMessage);
    socket.on("typing", handleTyping);
    socket.on("stopTyping", handleStopTyping);
    socket.on("messagesSeen", handleMessagesSeen);

    return () => {
      socket.off("newMessage", handleNewMessage);
      socket.off("typing", handleTyping);
      socket.off("stopTyping", handleStopTyping);
      socket.off("messagesSeen", handleMessagesSeen);
    };
  }, [socket, activeChat, userData, dispatch]);

  // Typing event emits
  const handleInputChange = (e) => {
    setInputText(e.target.value);
    if (!socket || !activeChat) return;

    if (!isTyping) {
      setIsTyping(true);
      socket.emit("typing", { receiverId: activeChat._id });
    }

    // Stop typing timeout
    const lastTypingTime = new Date().getTime();
    const timerLength = 3000;
    setTimeout(() => {
      const timeNow = new Date().getTime();
      const timeDiff = timeNow - lastTypingTime;
      if (timeDiff >= timerLength && isTyping) {
        socket.emit("stopTyping", { receiverId: activeChat._id });
        setIsTyping(false);
      }
    }, timerLength);
  };

  // Send message
  const handleSendMessage = async () => {
    if (!inputText.trim() && !mediaFile) return;
    const textToSend = inputText;
    const fileToSend = mediaFile;

    setInputText("");
    setMediaFile(null);
    setMediaPreview("");
    if (socket && activeChat) {
      socket.emit("stopTyping", { receiverId: activeChat._id });
      setIsTyping(false);
    }

    try {
      const formData = new FormData();
      if (textToSend.trim()) formData.append("message", textToSend);
      if (fileToSend) formData.append("image", fileToSend);

      const res = await axiosInstance.post(`/api/message/send/${activeChat._id}`, formData);
      setChatMessages((prev) => [...prev, res.data]);

      // Refresh recent chats
      const prevChatsRes = await axiosInstance.get("/api/message/prevChats");
      dispatch(setPrevChatUsers(prevChatsRes.data || []));
    } catch (err) {
      console.error("Failed to send message:", err);
    }
  };

  // Handle media selection
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setMediaFile(file);
    setMediaPreview(URL.createObjectURL(file));
  };

  // Filtered chats based on search
  const filteredChats = prevChatUsers?.filter((chat) => {
    const nameMatch = chat.user?.name?.toLowerCase().includes(searchQuery.toLowerCase());
    const userMatch = chat.user?.userName?.toLowerCase().includes(searchQuery.toLowerCase());
    return nameMatch || userMatch;
  }) || [];

  return (
    <div className="fixed bottom-6 right-6 z-[999] flex items-end gap-4 font-sans select-none pointer-events-none">
      
      {/* Floating Chat Box Window */}
      <AnimatePresence>
        {activeChat && (
          <motion.div
            drag
            dragListener={false}
            dragMomentum={false}
            dragElastic={0}
            dragControls={activeChatDragControls}
            onDragEnd={(event, info) => {
              const newPos = { x: chatPosition.x + info.offset.x, y: chatPosition.y + info.offset.y }
              setChatPosition(newPos)
              savePosition("chat", newPos)
            }}
            style={{ x: chatPosition.x, y: chatPosition.y }}
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className={`w-80 bg-[var(--card)] border border-[var(--border)] rounded-2xl shadow-2xl flex flex-col pointer-events-auto ${
              isMinimized ? "h-14" : "h-[450px]"
            } overflow-hidden`}
          >
            {/* Header */}
            <div 
              onPointerDown={(e) => activeChatDragControls.start(e)}
              className="px-4 py-3 bg-[var(--background-secondary)]/95 border-b border-[var(--border)] flex items-center justify-between cursor-grab active:cursor-grabbing flex-shrink-0 select-none"
              onClick={() => setIsMinimized(!isMinimized)}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="relative">
                  <img
                    src={activeChat.profileImage || dp}
                    alt=""
                    className="w-8 h-8 rounded-full object-cover border border-[var(--border)]"
                  />
                  {onlineUsers.includes(activeChat._id) && (
                    <div className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border border-[var(--card)] bg-green-500 shadow-[0_0_6px_rgba(34,197,94,0.8)]" />
                  )}
                </div>
                <div className="truncate text-left">
                  <p className="text-xs font-bold text-[var(--text-primary)] truncate">{activeChat.name}</p>
                  <p className="text-[10px] text-[var(--text-muted)] truncate">
                    {onlineUsers.includes(activeChat._id) ? "Online" : "Offline"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 text-[var(--text-muted)]">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsMinimized(!isMinimized);
                  }}
                  className="hover:text-[var(--text-primary)] transition-colors cursor-pointer"
                >
                  <FiMinus size={16} />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveChat(null);
                  }}
                  className="hover:text-red-500 transition-colors cursor-pointer"
                >
                  <FiX size={16} />
                </button>
              </div>
            </div>

            {/* Chat Body & Input (only if not minimized) */}
            {!isMinimized && (
              <>
                {/* Messages feed */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin">
                  {chatMessages.map((msg, index) => {
                    const isOwn = (msg.sender?._id || msg.sender)?.toString() === userData?._id?.toString();
                    return (
                      <div
                        key={msg._id || index}
                        className={`flex flex-col ${isOwn ? "items-end text-right" : "items-start text-left"}`}
                      >
                        <div
                          className={`max-w-[75%] px-3 py-2 rounded-2xl text-xs ${
                            isOwn
                              ? "bg-gradient-to-r from-[#8B5CF6] to-[#A855F7] text-white rounded-tr-none"
                              : "bg-[var(--bubble-receiver-bg)] border border-[var(--bubble-receiver-border)] text-[var(--bubble-receiver-text)] rounded-tl-none"
                          }`}
                        >
                          {msg.image && (
                            <img
                              src={msg.image}
                              alt=""
                              className="rounded-lg max-w-full mb-1.5 object-cover max-h-40 cursor-pointer"
                              onClick={() => window.open(msg.image, "_blank")}
                            />
                          )}
                          {msg.message && <p className="leading-relaxed break-words whitespace-pre-wrap select-text">{msg.message}</p>}
                        </div>
                        <span className="text-[9px] text-[var(--text-muted)] mt-1 select-none">
                          {formatTime(msg.createdAt)}
                          {isOwn && index === chatMessages.length - 1 && (
                            <span className="ml-1 text-[var(--primary)]">
                              {msg.seen ? " · Seen" : " · Sent"}
                            </span>
                          )}
                        </span>
                      </div>
                    );
                  })}
                  {isOtherTyping && (
                    <div className="flex items-center gap-1.5 text-[var(--text-muted)] text-[10px] pl-1">
                      <span className="animate-bounce">●</span>
                      <span className="animate-bounce [animation-delay:0.2s]">●</span>
                      <span className="animate-bounce [animation-delay:0.4s]">●</span>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Media Preview inside box */}
                {mediaPreview && (
                  <div className="px-4 py-2 border-t border-[var(--border)] bg-[var(--background-secondary)]/50 flex items-center justify-between">
                    <div className="relative w-12 h-12 rounded overflow-hidden border border-[var(--border)]">
                      <img src={mediaPreview} alt="" className="w-full h-full object-cover" />
                      <button
                        onClick={() => {
                          setMediaFile(null);
                          setMediaPreview("");
                        }}
                        className="absolute top-0.5 right-0.5 bg-[var(--background-secondary)] border border-[var(--border)] rounded-full p-0.5 text-[var(--text-primary)] hover:bg-[var(--hover)]"
                      >
                        <FiX size={10} />
                      </button>
                    </div>
                    <span className="text-[10px] text-[var(--text-muted)] truncate max-w-[150px]">{mediaFile?.name}</span>
                  </div>
                )}

                {/* Text Field Inputs */}
                <div className="p-3 bg-[var(--background-secondary)]/50 border-t border-[var(--border)] flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="p-2 hover:bg-[var(--hover)] rounded-full text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
                  >
                    <FiImage size={15} />
                    <input
                      type="file"
                      accept="image/*"
                      ref={fileInputRef}
                      className="hidden"
                      onChange={handleFileChange}
                    />
                  </button>

                  <input
                    type="text"
                    placeholder="Type a message..."
                    value={inputText}
                    onChange={handleInputChange}
                    onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                    className="flex-1 bg-[var(--input-bg)] border border-[var(--input-border)] rounded-xl py-1.5 px-3 text-xs text-[var(--text-primary)] outline-none focus:border-[var(--primary)] placeholder:text-[var(--text-muted)]"
                  />

                  <button
                    onClick={handleSendMessage}
                    disabled={!inputText.trim() && !mediaFile}
                    className="p-2 bg-[var(--primary)] hover:opacity-90 disabled:opacity-30 disabled:cursor-not-allowed text-white rounded-xl transition-all cursor-pointer"
                  >
                    <FiSend size={13} />
                  </button>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Compact Messenger Popup List */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            drag
            dragListener={false}
            dragMomentum={false}
            dragElastic={0}
            dragControls={listDragControls}
            onDragEnd={(event, info) => {
              const newPos = { x: listPosition.x + info.offset.x, y: listPosition.y + info.offset.y }
              setListPosition(newPos)
              savePosition("list", newPos)
            }}
            style={{ x: listPosition.x, y: listPosition.y }}
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="w-80 h-[450px] bg-[var(--card)] border border-[var(--border)] rounded-2xl shadow-2xl flex flex-col overflow-hidden pointer-events-auto"
          >
            {/* Header */}
            <div 
              onPointerDown={(e) => listDragControls.start(e)}
              className="px-4 py-3 border-b border-[var(--border)] flex items-center justify-between flex-shrink-0 bg-[var(--background-secondary)]/95 cursor-grab active:cursor-grabbing select-none"
            >
              <span className="text-xs font-bold text-[var(--text-primary)]">Recent Chats</span>
              <button
                onClick={() => setIsOpen(false)}
                className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
              >
                <FiX size={16} />
              </button>
            </div>

            {/* Search input */}
            <div className="p-3 border-b border-[var(--border)] flex items-center gap-2 bg-[var(--background-secondary)]/40">
              <FiSearch className="text-[var(--text-muted)] text-xs" />
              <input
                type="text"
                placeholder="Search chats..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 bg-transparent text-xs text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)]"
              />
            </div>

            {/* Conversations list */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {filteredChats.map((chat) => {
                const isOnline = onlineUsers.includes(chat.user?._id);
                return (
                  <div
                    key={chat.user?._id}
                    onClick={() => {
                      setActiveChat(chat.user);
                      setIsOpen(false);
                    }}
                    className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-[var(--hover)] transition-colors cursor-pointer"
                  >
                    <div className="relative flex-shrink-0">
                      <img
                        src={chat.user?.profileImage || dp}
                        alt=""
                        className="w-9 h-9 rounded-full object-cover border border-[var(--border)]"
                      />
                      {isOnline && (
                        <div className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border border-[var(--card)] bg-green-500 shadow-[0_0_6px_rgba(34,197,94,0.8)]" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0 text-left">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-semibold text-[var(--text-primary)] truncate">{chat.user?.name}</p>
                        <span className="text-[9px] text-[var(--text-muted)]">
                          {formatTime(chat.lastMessageTimestamp)}
                        </span>
                      </div>
                      <p className="text-[10px] text-[var(--text-secondary)] truncate mt-0.5">
                        {chat.lastMessageSender === userData?._id ? "You: " : ""}
                        {chat.lastMessage}
                      </p>
                    </div>

                    {chat.unreadCount > 0 && (
                      <span className="bg-red-500 text-white rounded-full min-w-[16px] h-4 px-1 text-[9px] flex items-center justify-center font-bold flex-shrink-0 animate-pulse">
                        {chat.unreadCount}
                      </span>
                    )}
                  </div>
                );
              })}
              {filteredChats.length === 0 && (
                <div className="text-center py-20 text-xs text-[var(--text-muted)]">No conversations found</div>
              )}
            </div>

            {/* Footer View All Messages */}
            <div className="p-3 border-t border-[var(--border)] bg-[var(--background-secondary)]/50 flex-shrink-0">
              <button
                onClick={() => {
                  setIsOpen(false);
                  navigate("/messages");
                }}
                className="w-full py-2 bg-[var(--primary)] hover:opacity-90 text-white text-xs font-semibold rounded-xl transition-all cursor-pointer"
              >
                View all messages
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pill Launcher Button */}
      {!isOpen && !activeChat && (
        <motion.button
          onClick={() => setIsOpen(!isOpen)}
          className="h-12 px-5 rounded-full bg-[var(--card)] border border-[var(--border)] shadow-xl hover:bg-[var(--hover)] flex items-center gap-2.5 pointer-events-auto transition-all cursor-pointer select-none"
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
        >
          <FiMessageCircle size={20} className="text-[var(--primary)]" />
          <span className="text-xs font-bold text-[var(--text-primary)]">Messages</span>
          
          {/* Unread Message Badge */}
          {unreadCount > 0 && (
            <span className="bg-red-500 text-white rounded-full min-w-[18px] h-4 px-1.5 text-[9px] flex items-center justify-center font-black animate-pulse">
              {unreadCount}
            </span>
          )}

          {/* Dynamic active user avatars stack */}
          <div className="flex -space-x-2.5 overflow-hidden ml-1">
            {prevChatUsers?.slice(0, 2).map((chat) => (
              <img
                key={chat.user?._id}
                className="inline-block h-6.5 w-6.5 rounded-full object-cover ring-2 ring-[var(--card)]"
                src={chat.user?.profileImage || dp}
                alt=""
              />
            ))}
          </div>
        </motion.button>
      )}

    </div>
  );
};

export default FloatingMessenger;
