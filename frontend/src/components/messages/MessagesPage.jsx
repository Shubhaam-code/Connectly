import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiSearch,
  FiPhone,
  FiVideo,
  FiInfo,
  FiPlus,
  FiSmile,
  FiPaperclip,
  FiSend,
} from "react-icons/fi";
import { Avatar, Input, Divider } from "../ui/UIComponents";
import { formatTimeChat } from "../../utils/formatters";

export const MessageItem = ({ message, isOwn, onReaction }) => {
  const [showReactions, setShowReactions] = useState(false);

  return (
    <motion.div
      className={`flex ${isOwn ? "justify-end" : "justify-start"} mb-3`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
    >
      <motion.div
        className={`max-w-xs px-4 py-2 rounded-2xl ${isOwn
            ? "bg-blue-500 text-white rounded-br-none"
            : "bg-gray-200 text-gray-800 rounded-bl-none"
          }`}
        whileHover={{ scale: 1.02 }}
      >
        {/* Message content */}
        {message.type === "text" && <p className="break-words">{message.content}</p>}
        {message.type === "image" && (
          <img
            src={message.content}
            alt="message"
            className="max-w-xs rounded-lg"
          />
        )}
        {message.type === "video" && (
          <video
            src={message.content}
            className="max-w-xs rounded-lg"
            controls
          />
        )}

        {/* Message reactions */}
        {message.reactions && message.reactions.length > 0 && (
          <div className="flex space-x-1 mt-1">
            {message.reactions.map((reaction, idx) => (
              <span key={idx} className="text-sm">
                {reaction}
              </span>
            ))}
          </div>
        )}

        {/* Time */}
        <p
          className={`text-xs mt-1 ${isOwn ? "text-blue-100" : "text-gray-500"
            }`}
        >
          {formatTimeChat(message.timestamp)}
          {isOwn && message.seen && " ✓✓"}
        </p>
      </motion.div>
    </motion.div>
  );
};

export const ChatPanel = ({
  selectedChat,
  messages = [],
  currentUser,
  onSendMessage,
  onTyping,
  isLoading = false,
  typingIndicator = false,
}) => {
  const [messageText, setMessageText] = useState("");
  const [attachments, setAttachments] = useState([]);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = () => {
    if (messageText.trim() || attachments.length > 0) {
      onSendMessage?.({
        content: messageText,
        attachments: attachments,
      });
      setMessageText("");
      setAttachments([]);
    }
  };

  const handleTyping = (text) => {
    setMessageText(text);
    onTyping?.();
  };

  if (!selectedChat) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-500">
        <p>Select a chat to start messaging</p>
      </div>
    );
  }

  return (
    <motion.div
      className="flex-1 flex flex-col bg-white"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      {/* Chat header */}
      <div className="border-b p-4 flex items-center justify-between bg-white sticky top-0 z-10">
        <div className="flex items-center space-x-3">
          <Avatar
            src={selectedChat.avatar}
            alt={selectedChat.name}
            size="md"
          />
          <div>
            <p className="font-semibold">{selectedChat.name}</p>
            <p className="text-xs text-gray-500">
              {selectedChat.isOnline ? (
                <span className="text-green-500">Active now</span>
              ) : (
                `Active ${formatTimeChat(selectedChat.lastSeen)}`
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <motion.button
            className="p-2 hover:bg-gray-100 rounded-full"
            whileHover={{ scale: 1.1 }}
          >
            <FiPhone size={20} />
          </motion.button>
          <motion.button
            className="p-2 hover:bg-gray-100 rounded-full"
            whileHover={{ scale: 1.1 }}
          >
            <FiVideo size={20} />
          </motion.button>
          <motion.button
            className="p-2 hover:bg-gray-100 rounded-full"
            whileHover={{ scale: 1.1 }}
          >
            <FiInfo size={20} />
          </motion.button>
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
          </div>
        ) : messages.length > 0 ? (
          <AnimatePresence>
            {messages.map((message) => (
              <MessageItem
                key={message._id}
                message={message}
                isOwn={message.sender?._id === currentUser?._id}
              />
            ))}
          </AnimatePresence>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400">
            <p>No messages yet. Start the conversation!</p>
          </div>
        )}

        {/* Typing indicator */}
        {typingIndicator && (
          <motion.div
            className="flex items-center space-x-1"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100" />
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200" />
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <Divider />
      <div className="p-4 space-y-3">
        {/* Attachments preview */}
        {attachments.length > 0 && (
          <motion.div className="flex space-x-2 overflow-x-auto">
            {attachments.map((attachment, idx) => (
              <motion.div
                key={idx}
                className="relative flex-shrink-0"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
              >
                {attachment.type === "image" ? (
                  <img
                    src={attachment.preview}
                    alt="attachment"
                    className="h-16 w-16 object-cover rounded-lg"
                  />
                ) : (
                  <div className="h-16 w-16 bg-gray-200 rounded-lg flex items-center justify-center">
                    <FiPaperclip />
                  </div>
                )}
                <motion.button
                  onClick={() =>
                    setAttachments(attachments.filter((_, i) => i !== idx))
                  }
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                  whileHover={{ scale: 1.1 }}
                >
                  ✕
                </motion.button>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Message input */}
        <div className="flex items-center space-x-2">
          <motion.label
            className="p-2 hover:bg-gray-100 rounded-full cursor-pointer transition-colors"
            whileHover={{ scale: 1.1 }}
            title="Attach files"
          >
            <FiPaperclip size={20} />
            <input
              type="file"
              multiple
              hidden
              onChange={(e) => {
                // Handle file attachment
              }}
            />
          </motion.label>

          <Input
            type="text"
            placeholder="Aa"
            value={messageText}
            onChange={(e) => handleTyping(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            className="flex-1 rounded-full"
          />

          <motion.button
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <FiSmile size={20} />
          </motion.button>

          <motion.button
            onClick={handleSend}
            disabled={!messageText.trim() && attachments.length === 0}
            className="p-2 hover:bg-blue-100 text-blue-600 rounded-full transition-colors disabled:text-gray-400"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <FiSend size={20} />
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};

export const ChatList = ({ chats, selectedChat, onSelectChat, searchQuery }) => {
  const filteredChats = chats.filter((chat) =>
    chat.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <motion.div
      className="w-80 border-r bg-white flex flex-col"
      initial={{ x: -300 }}
      animate={{ x: 0 }}
    >
      {/* Header */}
      <div className="p-4 border-b sticky top-0 bg-white z-10">
        <h1 className="text-2xl font-bold mb-4">Messages</h1>
        <Input placeholder="Search conversations..." />
      </div>

      {/* Chat list */}
      <div className="flex-1 overflow-y-auto">
        <AnimatePresence>
          {filteredChats.map((chat) => (
            <motion.button
              key={chat._id}
              onClick={() => onSelectChat(chat)}
              className={`w-full p-3 text-left border-b hover:bg-gray-50 transition-colors ${selectedChat?._id === chat._id ? "bg-gray-100" : ""
                }`}
              whileHover={{ x: 5 }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <Avatar src={chat.avatar} alt={chat.name} size="lg" />
                  {chat.isOnline && (
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold truncate">{chat.name}</p>
                    <p className="text-xs text-gray-500 ml-2">
                      {formatTimeChat(chat.lastMessageTime)}
                    </p>
                  </div>
                  <p className="text-sm text-gray-500 truncate">
                    {chat.lastMessage}
                  </p>
                </div>
                {chat.unreadCount > 0 && (
                  <motion.div
                    className="flex-shrink-0 w-5 h-5 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                  >
                    {chat.unreadCount}
                  </motion.div>
                )}
              </div>
            </motion.button>
          ))}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export const MessagesPage = ({ chats = [], currentUser, onSendMessage }) => {
  const [selectedChat, setSelectedChat] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [messages, setMessages] = useState([]);

  return (
    <div className="flex h-full bg-white">
      <ChatList
        chats={chats}
        selectedChat={selectedChat}
        onSelectChat={setSelectedChat}
        searchQuery={searchQuery}
      />
      <ChatPanel
        selectedChat={selectedChat}
        messages={messages}
        currentUser={currentUser}
        onSendMessage={onSendMessage}
      />
    </div>
  );
};

export default MessagesPage;
