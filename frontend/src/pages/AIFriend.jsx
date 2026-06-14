import React, { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { MdOutlineKeyboardBackspace } from 'react-icons/md'
import { IoSendSharp } from 'react-icons/io5'
import Nav from '../components/Nav'

// HINGLISH: AI Friend page — CONNECTLY ka AI companion "ConnectlyAI"
// Ye ek simulated AI chat hai — future mein OpenAI se connect hoga
function AIFriend() {
  const navigate = useNavigate()
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
    <div className="w-full h-screen flex flex-col" style={{ background: '#0D1117' }}>

      {/* HINGLISH: AI Friend header */}
      <div className="flex items-center gap-3 px-4 py-3 flex-shrink-0"
        style={{
          background: 'rgba(13,17,23,0.95)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(255,255,255,0.06)'
        }}>
        <button className="text-gray-400 hover:text-white transition-colors"
          onClick={() => navigate('/')}>
          <MdOutlineKeyboardBackspace size={22} />
        </button>

        {/* HINGLISH: AI avatar — pulsing orb */}
        <div className="w-10 h-10 rounded-full flex items-center justify-center ai-orb-pulse"
          style={{ background: 'linear-gradient(135deg, #7C3AED, #EC4899)' }}>
          <span className="text-lg">🤖</span>
        </div>

        <div className="flex-1">
          <div className="text-sm font-bold text-white">AI Friend</div>
          <div className="text-xs" style={{ color: '#10B981' }}>● Your Companion • Always Online</div>
        </div>

        {/* HINGLISH: Info icon */}
        <button className="w-9 h-9 rounded-full flex items-center justify-center"
          style={{ background: 'rgba(255,255,255,0.05)' }}>
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2">
            <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </button>
      </div>

      {/* HINGLISH: Messages area */}
      <div className="flex-1 overflow-y-auto px-4 py-6 flex flex-col gap-4">

        {/* HINGLISH: AI avatar + intro card at top */}
        <div className="flex flex-col items-center gap-3 mb-4">
          <div className="w-20 h-20 rounded-full flex items-center justify-center ai-orb-pulse"
            style={{ background: 'linear-gradient(135deg, #7C3AED, #EC4899)' }}>
            <span className="text-3xl">🤖</span>
          </div>
          <div className="text-center">
            <h2 className="text-white font-bold text-lg">ConnectlyAI</h2>
            <p className="text-sm" style={{ color: '#9CA3AF' }}>Your emotional companion</p>
          </div>
        </div>

        {/* HINGLISH: Chat messages */}
        {messages.map((msg, index) => (
          <div key={index} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'} gap-3`}>
            {msg.sender === 'ai' && (
              <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: 'linear-gradient(135deg, #7C3AED, #EC4899)' }}>
                <span className="text-sm">🤖</span>
              </div>
            )}
            <div className={`max-w-[75%] flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
              <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-line
                ${msg.sender === 'user' ? 'bubble-sender' : ''}`}
                style={msg.sender === 'ai' ? {
                  background: 'rgba(124,58,237,0.1)',
                  border: '1px solid rgba(124,58,237,0.2)',
                  color: '#E5E7EB',
                  borderRadius: '20px 20px 20px 4px'
                } : {}}>
                {msg.text}
              </div>
              <span className="text-[10px] mt-1 px-1" style={{ color: '#4B5563' }}>{msg.time}</span>
            </div>
          </div>
        ))}

        {/* HINGLISH: AI typing indicator */}
        {isTyping && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #7C3AED, #EC4899)' }}>
              <span className="text-sm">🤖</span>
            </div>
            <div className="px-4 py-3 rounded-2xl flex items-center gap-1.5"
              style={{ background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.2)' }}>
              {[0, 1, 2].map(i => (
                <div key={i} className="w-2 h-2 rounded-full"
                  style={{
                    background: '#7C3AED',
                    animation: 'glowPulse 1s ease-in-out infinite',
                    animationDelay: `${i * 0.2}s`
                  }} />
              ))}
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* HINGLISH: Suggestion chips — quick conversation starters */}
      <div className="px-4 pb-3 flex gap-2 overflow-x-auto flex-shrink-0">
        {suggestions.map((s, i) => (
          <button key={i}
            className="flex-shrink-0 flex items-center gap-2 px-3 py-2 rounded-full text-sm hover-scale"
            style={{ background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.2)', color: '#C4B5FD' }}
            onClick={() => { setInput(s.text); }}>
            <span>{s.icon}</span>
            <span className="text-xs">{s.label}</span>
          </button>
        ))}
      </div>

      {/* HINGLISH: Message input */}
      <div className="flex-shrink-0 px-4 py-3"
        style={{ background: 'rgba(13,17,23,0.95)', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="flex items-center gap-3">
          <div className="flex-1 flex items-center px-4 h-[48px] rounded-full"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(124,58,237,0.2)' }}>
            <input
              type="text"
              placeholder="Talk with your AI friend..."
              className="flex-1 text-sm text-white bg-transparent outline-none placeholder:text-gray-600"
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
  )
}

export default AIFriend
