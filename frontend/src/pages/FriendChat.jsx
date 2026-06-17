import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { MdOutlineKeyboardBackspace } from 'react-icons/md';
import { IoSendSharp } from 'react-icons/io5';
import { FiTrash2, FiAlertCircle, FiRefreshCw } from 'react-icons/fi';
import Layout from '../components/layout/Layout';
import dp from "../assets/dp.webp";
import { SERVER_URL } from '../lib/axiosInstance';
import { motion, AnimatePresence } from 'framer-motion';
import { renderMessageText } from '../components/ui/MarkdownRenderer';

function FriendChat() {
  const navigate = useNavigate();
  const { userData } = useSelector((state) => state.user);
  const messagesEndRef = useRef(null);

  const [messages, setMessages] = useState(() => {
    const saved = localStorage.getItem('connectly_ai_friend_page_messages');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // Fallback to default greeting
      }
    }
    return [
      {
        id: 'greet',
        sender: 'assistant',
        text: "Hi, I'm ConnectlyAI! 🤖\nYour emotional companion.\nHow are you feeling today? 💜",
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ];
  });

  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState(null);
  const [retryPayload, setRetryPayload] = useState(null);

  // Suggestions starter list
  const suggestions = [
    { icon: '💬', label: 'Talk with me', text: "I want to talk with you. I'm feeling a bit lonely today." },
    { icon: '💝', label: 'Relationship advice', text: "Can you give me some advice on maintaining healthy friendships?" },
    { icon: '🚀', label: 'Motivate me', text: "Give me some daily motivation for my project!" },
    { icon: '💻', label: 'Write code', text: "Help me write a simple React component using custom hooks!" }
  ];

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  // Sync to local storage
  useEffect(() => {
    localStorage.setItem('connectly_ai_friend_page_messages', JSON.stringify(messages));
  }, [messages]);

  const handleClearChat = () => {
    if (window.confirm('Wipe our chat memory? 💜')) {
      setMessages([
        {
          id: 'greet',
          sender: 'assistant',
          text: 'Memory cleared! 🧹 What shall we talk about next? ✨',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
      setError(null);
      setRetryPayload(null);
    }
  };

  // Streaming message processor
  const sendMessageStream = async (messageText, isRetry = false) => {
    if (!messageText.trim()) return;
    setError(null);

    let currentMessages = messages;
    if (!isRetry) {
      const userMsg = {
        id: Math.random().toString(36).substring(7),
        sender: 'user',
        text: messageText,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      currentMessages = [...messages, userMsg];
      setMessages(currentMessages);
      setInput("");
    }

    setIsTyping(true);

    const assistantMsgId = Math.random().toString(36).substring(7);
    const newAssistantMsg = {
      id: assistantMsgId,
      sender: 'assistant',
      text: '',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, newAssistantMsg]);

    try {
      const response = await fetch(`${SERVER_URL}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ message: messageText, stream: true })
      });

      if (!response.ok) {
        throw new Error(response.statusText || 'Connection failed');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let accumulatedResponse = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const cleanLine = line.trim();
          if (!cleanLine) continue;
          if (cleanLine === 'data: [DONE]') continue;

          if (cleanLine.startsWith('data: ')) {
            try {
              const data = JSON.parse(cleanLine.slice(6));
              if (data.content) {
                accumulatedResponse += data.content;
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === assistantMsgId ? { ...msg, text: accumulatedResponse } : msg
                  )
                );
              }
            } catch (err) {
              // Ignore partial JSON parsing errors during frames
            }
          }
        }
      }
    } catch (err) {
      console.error('Error sending chat:', err);
      setError("Unable to connect to your AI Friend. Check your connection or Groq configuration.");
      setRetryPayload(messageText);

      // Clean up the empty streaming bubble if it failed immediately
      setMessages((prev) => prev.filter((msg) => msg.id !== assistantMsgId));
    } finally {
      setIsTyping(false);
    }
  };

  const handleSend = (e) => {
    if (e) e.preventDefault();
    if (!input.trim() || isTyping) return;
    sendMessageStream(input);
  };

  const handleRetry = () => {
    if (retryPayload) {
      sendMessageStream(retryPayload, true);
    }
  };

  return (
    <Layout>
      <div className="w-full h-[calc(100vh-70px)] md:h-screen flex flex-col overflow-hidden bg-[var(--background)]">
        
        {/* Chat Header */}
        <div className="flex items-center gap-3 px-4 py-3 flex-shrink-0 bg-[var(--background-secondary)] border-b border-[var(--border)]">
          <button
            className="text-neutral-400 hover:text-white transition-colors"
            onClick={() => navigate('/')}
          >
            <MdOutlineKeyboardBackspace size={22} />
          </button>

          {/* AI Avatar */}
          <div className="w-10 h-10 rounded-full flex items-center justify-center ai-orb-pulse bg-gradient-to-tr from-purple-600 to-pink-500">
            <span className="text-lg select-none">🤖</span>
          </div>

          <div className="flex-1 min-w-0">
            <div className="text-sm font-bold text-white truncate">ConnectlyAI</div>
            <div className="text-[10px] text-green-400 flex items-center gap-1 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              Online Companion
            </div>
          </div>

          {/* Clear Memory Action */}
          <button
            onClick={handleClearChat}
            title="Clear Chat Memory"
            className="w-9 h-9 rounded-full flex items-center justify-center bg-neutral-900 border border-[var(--border)] text-neutral-400 hover:text-rose-500 hover:border-rose-500/20 transition-all cursor-pointer"
          >
            <FiTrash2 size={15} />
          </button>
        </div>

        {/* Message Thread Box */}
        <div className="flex-1 overflow-y-auto px-4 py-6 flex flex-col gap-4 scrollbar-none">
          
          {/* AI Profile Intro */}
          <div className="flex flex-col items-center gap-3 mb-6 animate-fade-in">
            <div className="w-20 h-20 rounded-full flex items-center justify-center ai-orb-pulse bg-gradient-to-tr from-purple-600 to-pink-500 shadow-xl shadow-purple-500/10">
              <span className="text-3xl select-none">🤖</span>
            </div>
            <div className="text-center">
              <h2 className="text-white font-black text-lg tracking-tight">ConnectlyAI</h2>
              <p className="text-xs text-neutral-400 mt-0.5">Your supportive AI companion powered by Llama 3.3</p>
            </div>
          </div>

          {/* Messages */}
          {messages.map((msg, index) => {
            const isUser = msg.sender === 'user';
            return (
              <div
                key={msg.id || index}
                className={`flex ${isUser ? 'justify-end' : 'justify-start'} gap-3 items-end max-w-full`}
              >
                {!isUser && (
                  <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-gradient-to-tr from-purple-600 to-pink-500 text-xs border border-white/10 select-none shadow">
                    🤖
                  </div>
                )}
                <div className={`max-w-[80%] md:max-w-[70%] flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
                  <div className={`px-4 py-2.5 text-sm leading-relaxed border ${
                    isUser
                      ? 'bg-gradient-to-r from-purple-600 to-[#A855F7] border-purple-500/20 text-white rounded-2xl rounded-tr-none shadow-md shadow-purple-500/5'
                      : 'bg-[var(--card)] border-[var(--border)] text-white rounded-2xl rounded-tl-none shadow-sm'
                  }`}>
                    {renderMessageText(msg.text)}
                  </div>
                  <span className="text-[9px] mt-1 px-1 text-neutral-500 select-none font-medium">{msg.time}</span>
                </div>
                {isUser && (
                  <img
                    src={userData?.profileImage || dp}
                    alt=""
                    className="w-8 h-8 rounded-full object-cover flex-shrink-0 border border-[var(--border)] bg-neutral-900 shadow"
                  />
                )}
              </div>
            );
          })}

          {/* Typing Indicator */}
          {isTyping && messages[messages.length - 1]?.text === '' && (
            <div className="flex gap-3 items-end">
              <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-gradient-to-tr from-purple-600 to-pink-500 text-xs border border-white/10 select-none">
                🤖
              </div>
              <div className="bg-[var(--card)] border border-[var(--border)] px-4 py-3 rounded-2xl rounded-tl-none flex items-center gap-1.5 shadow-sm">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="w-2 h-2 rounded-full bg-neutral-500 animate-bounce"
                    style={{ animationDelay: `${i * 0.15}s` }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Error Banner */}
          {error && (
            <div className="mx-auto max-w-sm flex items-center gap-3 p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-400">
              <FiAlertCircle size={16} className="flex-shrink-0 text-rose-500" />
              <div className="flex-1 leading-normal">{error}</div>
              <button
                onClick={handleRetry}
                className="flex items-center gap-1 bg-rose-500/20 hover:bg-rose-500/30 transition-colors px-2.5 py-1 rounded-lg font-bold text-rose-300 cursor-pointer"
              >
                <FiRefreshCw size={11} className={isTyping ? "animate-spin" : ""} />
                Retry
              </button>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Suggestion Starter Chips */}
        <div className="px-4 pb-3 flex gap-2 overflow-x-auto flex-shrink-0 scrollbar-none select-none">
          {suggestions.map((s, i) => (
            <button
              key={i}
              className="flex-shrink-0 flex items-center gap-2 px-3.5 py-2 rounded-full text-xs font-semibold bg-[var(--card)] border border-[var(--border)] text-neutral-300 hover:border-purple-500/50 hover:bg-neutral-900 active:scale-95 transition-all cursor-pointer"
              disabled={isTyping}
              onClick={() => { setInput(s.text); }}
            >
              <span>{s.icon}</span>
              <span>{s.label}</span>
            </button>
          ))}
        </div>

        {/* Message Input bar */}
        <div className="flex-shrink-0 px-4 py-3 bg-[var(--background-secondary)] border-t border-[var(--border)]">
          <form onSubmit={handleSend} className="flex items-center gap-3 max-w-4xl mx-auto">
            <div className="flex-1 flex items-center px-4 h-[48px] rounded-full bg-[var(--card)] border border-[var(--border)] focus-within:border-purple-500/40 focus-within:shadow-[0_0_15px_rgba(139,92,246,0.05)] transition-all">
              <input
                type="text"
                placeholder={isTyping ? "ConnectlyAI is typing..." : "Send a message to your companion..."}
                className="flex-1 text-xs md:text-sm text-white bg-transparent outline-none placeholder:text-neutral-500 font-normal disabled:cursor-not-allowed"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={isTyping}
              />
            </div>
            <button
              type="submit"
              disabled={!input.trim() || isTyping}
              className="w-12 h-12 rounded-full flex items-center justify-center btn-gradient flex-shrink-0 hover-scale shadow-lg shadow-purple-500/10 disabled:opacity-45 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              <IoSendSharp className="text-white" size={16} />
            </button>
          </form>
        </div>
      </div>
    </Layout>
  );
}

export default FriendChat;
