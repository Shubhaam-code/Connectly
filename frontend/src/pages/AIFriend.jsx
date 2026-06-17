import React, { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { MdOutlineKeyboardBackspace } from 'react-icons/md'
import { IoSendSharp } from 'react-icons/io5'
import Layout from '../components/layout/Layout'
import dp from "../assets/dp.webp"

// HINGLISH: AI Friend page — CONNECTLY ka AI companion "ConnectlyAI"
// Ye ek simulated AI chat hai — future mein OpenAI se connect hoga
function AIFriend() {
  const navigate = useNavigate()
  const { userData } = useSelector(state => state.user)
  const [messages, setMessages] = useState([
    {
      sender: 'ai',
      text: "Hi, I'm ConnectlyAI! 🤖\nYour emotional companion.\nHow are you feeling today? 💜",
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ])
  const [input, setInput] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef()

  // HINGLISH: Suggested conversation starters
  const suggestions = [
    { icon: '💬', label: 'Talk with me', text: "I want to talk with you. I'm feeling lonely." },
    { icon: '💝', label: 'Relationship advice', text: "Can you give me some relationship advice?" },
    { icon: '📦', label: 'Memory Box', text: "Let's create a memory together!" },
    { icon: '☀️', label: 'Daily Motivation', text: "Give me some motivation for today!" },
  ]

  // HINGLISH: AI responses ka array — randomly pick karna
  const aiResponses = [
    "That's really interesting! Tell me more about how you're feeling. 💜",
    "I'm here for you! Remember, every challenge makes you stronger. 🌟",
    "You're amazing and don't let anyone tell you otherwise! 💪",
    "I understand. It can be tough sometimes, but you've got this! ✨",
    "Let's look at this from a different angle. What do you think would make things better? 🤔",
    "That sounds wonderful! I'm so happy for you! 🎉",
    "Remember to take care of yourself first. Self-love is important! 💕",
    "You inspire me every day with your resilience! Keep going! 🚀",
  ]

  // HINGLISH: Message bhejne ka function — AI ka simulated response
  const handleSend = async () => {
    if (!input.trim()) return

    const userMsg = {
      sender: 'user',
      text: input,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }

    setMessages(prev => [...prev, userMsg])
    setInput("")
    setIsTyping(true)

    // HINGLISH: AI typing delay simulate karna
    setTimeout(() => {
      const aiMsg = {
        sender: 'ai',
        text: aiResponses[Math.floor(Math.random() * aiResponses.length)],
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
      setMessages(prev => [...prev, aiMsg])
      setIsTyping(false)
    }, 1500)
  }

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  return (
    <Layout>
      <div className="w-full h-[calc(100vh-4rem)] md:h-screen flex flex-col overflow-hidden bg-[var(--bg-primary)]">

        {/* HINGLISH: AI Friend header */}
        <div className="flex items-center gap-3 px-4 py-3 flex-shrink-0 bg-[var(--bg-secondary)] border-b border-[var(--border-color)]">
          <button className="text-[#A8A8A8] hover:text-white transition-colors"
            onClick={() => navigate('/')}>
            <MdOutlineKeyboardBackspace size={22} />
          </button>

          {/* HINGLISH: AI avatar — pulsing orb */}
          <div className="relative w-11 h-11 md:w-14 md:h-14 flex-shrink-0 ai-orb-pulse">
            <img
              src="/bot.png"
              alt="Connectly AI"
              className="w-full h-full rounded-full object-cover border-2 border-purple-500/20 shadow-md"
            />
            <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-[var(--bg-primary)] rounded-full animate-pulse" />
          </div>

          <div className="flex-1">
            <div className="text-sm font-bold text-[var(--text-primary)]">AI Friend</div>
            <div className="text-xs" style={{ color: '#10B981' }}>● Your Companion • Always Online</div>
          </div>

          {/* HINGLISH: Info icon */}
          <button className="w-9 h-9 rounded-full flex items-center justify-center bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--text-secondary)]">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </button>
        </div>

        {/* HINGLISH: Messages area */}
        <div className="flex-1 overflow-y-auto px-4 py-6 flex flex-col gap-4">

          {/* HINGLISH: AI avatar + intro card at top */}
          <div className="flex flex-col items-center gap-3 mb-4">
            <div className="relative w-20 h-20 flex-shrink-0 ai-orb-pulse">
              <img
                src="/bot.png"
                alt="Connectly AI"
                className="w-full h-full rounded-full object-cover border-2 border-purple-500/30 shadow-lg"
              />
              <span className="absolute bottom-1 right-1 w-4 h-4 bg-green-500 border-2 border-[var(--bg-primary)] rounded-full animate-pulse" />
            </div>
            <div className="text-center">
              <h2 className="text-[var(--text-primary)] font-bold text-lg">ConnectlyAI</h2>
              <p className="text-sm text-[var(--text-secondary)]">Your emotional companion</p>
            </div>
          </div>

          {/* HINGLISH: Chat messages */}
          {messages.map((msg, index) => (
            <div key={index} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'} gap-3 items-end`}>
              {msg.sender === 'ai' && (
                <div className="relative w-8 h-8 flex-shrink-0">
                  <img
                    src="/bot.png"
                    alt="Connectly AI"
                    className="w-full h-full rounded-full object-cover border border-purple-500/20 shadow-sm"
                  />
                  <span className="absolute bottom-0 right-0 w-2 h-2 bg-green-500 border border-[var(--bg-primary)] rounded-full animate-pulse" />
                </div>
              )}
              <div className={`max-w-[70%] flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
                <div className={`px-4 py-3 text-sm leading-relaxed whitespace-pre-line ${
                  msg.sender === 'user'
                    ? 'bubble-sender rounded-2xl rounded-br-sm'
                    : 'bubble-receiver rounded-2xl rounded-bl-sm'
                }`}>
                  {msg.text}
                </div>
                <span className="text-[10px] mt-1 px-1 text-[var(--text-secondary)] opacity-60">{msg.time}</span>
              </div>
              {msg.sender === 'user' && (
                <img
                  src={userData?.profileImage || dp}
                  alt=""
                  className="w-8 h-8 rounded-full object-cover flex-shrink-0 border border-[var(--border-color)] bg-neutral-900"
                />
              )}
            </div>
          ))}

          {/* HINGLISH: AI typing indicator */}
          {isTyping && (
            <div className="flex gap-3 items-end">
              <div className="relative w-8 h-8 flex-shrink-0">
                <img
                  src="/bot.png"
                  alt="Connectly AI"
                  className="w-full h-full rounded-full object-cover border border-purple-500/20 shadow-sm"
                />
                <span className="absolute bottom-0 right-0 w-2 h-2 bg-green-500 border border-[var(--bg-primary)] rounded-full animate-pulse" />
              </div>
              <div className="bubble-receiver px-4 py-3 rounded-2xl flex items-center gap-1.5">
                {[0, 1, 2].map(i => (
                  <div key={i} className="w-2 h-2 rounded-full bg-[var(--text-secondary)] opacity-60 animate-pulse"
                    style={{
                      animationDelay: `${i * 0.2}s`
                    }} />
                ))}
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* HINGLISH: Suggestion chips — quick conversation starters */}
        <div className="px-4 pb-3 flex gap-2 overflow-x-auto flex-shrink-0 scrollbar-none">
          {suggestions.map((s, i) => (
            <button key={i}
              className="flex-shrink-0 flex items-center gap-2 px-3.5 py-2 rounded-full text-xs font-semibold hover-scale bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-primary)] hover:border-purple-500/50 transition-all"
              onClick={() => { setInput(s.text); }}>
              <span>{s.icon}</span>
              <span>{s.label}</span>
            </button>
          ))}
        </div>

        {/* HINGLISH: Message input */}
        <div className="flex-shrink-0 px-4 py-3 bg-[var(--bg-secondary)] border-t border-[var(--border-color)]">
          <div className="flex items-center gap-3">
            <div className="flex-1 flex items-center px-4 h-[48px] rounded-full bg-[var(--bg-primary)] border border-[var(--border-color)] focus-within:border-purple-500/50 transition-all">
              <input
                type="text"
                placeholder="Talk with your AI friend..."
                className="flex-1 text-sm text-[var(--text-primary)] bg-transparent outline-none placeholder:text-gray-500"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              />
            </div>
            <button
              className="w-12 h-12 rounded-full flex items-center justify-center btn-gradient flex-shrink-0 hover-scale"
              onClick={handleSend}>
              <IoSendSharp className="text-white" size={18} />
            </button>
          </div>
        </div>
      </div>
    </Layout>
  )
}

export default AIFriend
