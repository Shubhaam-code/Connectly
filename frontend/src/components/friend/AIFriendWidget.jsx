import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence, useDragControls } from 'framer-motion'
import { FiMessageSquare, FiX, FiSend, FiTrash2 } from 'react-icons/fi'
import { SERVER_URL } from '../../lib/axiosInstance'

// Custom Sparkles SVG Icon
const SparklesIcon = ({ size = 16, className = "" }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275Z" />
    <path d="m5 3 1 2.5L8.5 6 6 7 5 9.5 4 7 1.5 6 4 5.5Z" />
    <path d="m19 17 1 2.5 2.5.5-2.5 1-1 2.5-1-2.5-2.5-1 2.5-1Z" />
  </svg>
)

// Custom CodeBlock Component with Copy Code functionality
const CodeBlock = ({ code, language }) => {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="my-2.5 rounded-xl overflow-hidden border border-[var(--border)] bg-[#1e1e24] shadow-md max-w-full font-mono text-[11px] text-left">
      <div className="bg-[#151518] px-3.5 py-1.5 flex items-center justify-between text-gray-400 border-b border-[var(--border)]">
        <span className="text-[9px] font-bold uppercase tracking-wider">{language || 'code'}</span>
        <button
          onClick={handleCopy}
          className="text-[9px] hover:text-white transition-colors bg-white/5 hover:bg-white/10 px-2 py-0.5 rounded-md font-semibold cursor-pointer"
        >
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
      <pre className="p-3.5 overflow-x-auto text-gray-200 leading-relaxed max-w-full whitespace-pre select-text">
        <code>{code}</code>
      </pre>
    </div>
  )
}

// Inline Markdown Parser: parses inline backticks `code` and bold **text**
const renderInlineMarkdown = (text) => {
  const parts = text.split(/(`[^`\n]+`)/g)
  return parts.map((part, idx) => {
    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code key={idx} className="bg-black/25 dark:bg-white/10 px-1 py-0.5 rounded text-[11px] font-mono text-[var(--primary)] font-semibold">
          {part.slice(1, -1)}
        </code>
      )
    }

    const subParts = part.split(/(\*\*[^*]+\*\*)/g)
    return subParts.map((subPart, subIdx) => {
      if (subPart.startsWith('**') && subPart.endsWith('**')) {
        return (
          <strong key={`${idx}-${subIdx}`} className="font-bold text-[var(--text)]">
            {subPart.slice(2, -2)}
          </strong>
        )
      }
      return subPart
    })
  })
}

// Full Markdown Parser: splits by code blocks first
const renderMessageText = (text) => {
  if (!text) return ''
  const parts = text.split(/(```[\s\S]*?```)/g)

  return parts.map((part, index) => {
    if (part.startsWith('```') && part.endsWith('```')) {
      const match = part.match(/```(\w*)\n([\s\S]*?)```/)
      const language = match ? match[1] : 'code'
      const code = match ? match[2] : part.slice(3, -3)
      return <CodeBlock key={index} code={code.trim()} language={language} />
    }
    return (
      <span key={index} className="whitespace-pre-wrap select-text">
        {renderInlineMarkdown(part)}
      </span>
    )
  })
}

function AIFriendWidget() {
  const dragControls = useDragControls()
  const [isOpen, setIsOpen] = useState(false)
  const [position, setPosition] = useState(() => {
    const saved = localStorage.getItem('connectly_ai_friend_pos')
    return saved ? JSON.parse(saved) : { x: -350, y: -200 } // Default shift left so it does not overlap messages
  })
  const [size, setSize] = useState(() => {
    const saved = localStorage.getItem('connectly_ai_friend_size')
    return saved ? JSON.parse(saved) : { width: 340, height: 480 }
  })

  const containerRef = useRef(null)

  const handlePointerUp = () => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect()
      const newSize = { width: Math.round(rect.width), height: Math.round(rect.height) }
      setSize(newSize)
      localStorage.setItem('connectly_ai_friend_size', JSON.stringify(newSize))
    }
  }
  const [messages, setMessages] = useState(() => {
    const saved = localStorage.getItem('connectly_ai_friend_messages')
    if (saved) {
      try {
        return JSON.parse(saved)
      } catch (e) {
        // Fallback to default greeting
      }
    }
    return [
      {
        id: 'greet',
        sender: 'assistant',
        text: 'Hey! 💜 I am your Connectly Companion. I am here to chat, brainstorm, write code, or just listen. Ask me anything! ✨',
        timestamp: new Date().toISOString()
      }
    ]
  })
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)

  const messagesEndRef = useRef(null)

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  // Sync to local storage
  useEffect(() => {
    localStorage.setItem('connectly_ai_friend_messages', JSON.stringify(messages))
  }, [messages])

  const handleClearChat = () => {
    if (window.confirm('Wipe our chat memory? 💜')) {
      setMessages([
        {
          id: 'greet',
          sender: 'assistant',
          text: 'Memory cleared! 🧹 What shall we chat about next? ✨',
          timestamp: new Date().toISOString()
        }
      ])
    }
  }

  const handleSendMessage = async (e) => {
    if (e) e.preventDefault()
    if (!input.trim() || isTyping) return

    const userText = input.trim()
    setInput('')

    // Append user message
    const userMsg = {
      id: Math.random().toString(36).substring(7),
      sender: 'user',
      text: userText,
      timestamp: new Date().toISOString()
    }
    setMessages((prev) => [...prev, userMsg])
    setIsTyping(true)

    // Prepare temp assistant bubble for streaming
    const assistantMsgId = Math.random().toString(36).substring(7)
    const newAssistantMsg = {
      id: assistantMsgId,
      sender: 'assistant',
      text: '',
      timestamp: new Date().toISOString()
    }
    setMessages((prev) => [...prev, newAssistantMsg])

    try {
      // Send chat context payload (last 10 messages)
      const payloadMessages = [...messages, userMsg].slice(-10).map((msg) => ({
        sender: msg.sender,
        text: msg.text
      }))

      const response = await fetch(`${SERVER_URL}/api/friend/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ messages: payloadMessages })
      })

      if (!response.ok) {
        throw new Error('Connection failed')
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      let accumulatedResponse = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          const cleanLine = line.trim()
          if (!cleanLine) continue
          if (cleanLine === 'data: [DONE]') continue

          if (cleanLine.startsWith('data: ')) {
            try {
              const data = JSON.parse(cleanLine.slice(6))
              if (data.content) {
                accumulatedResponse += data.content
                // Stream updates to the assistant message bubble in real-time
                setMessages((prev) => {
                  return prev.map((msg) => {
                    if (msg.id === assistantMsgId) {
                      return { ...msg, text: accumulatedResponse }
                    }
                    return msg
                  })
                })
              }
            } catch (err) {
              // Ignore framing errors
            }
          }
        }
      }
    } catch (error) {
      console.error('Error sending message:', error)
      setMessages((prev) => {
        return prev.map((msg) => {
          if (msg.id === assistantMsgId) {
            return {
              ...msg,
              text: 'Oh no! I lost my train of thought. Let me check my connection... 💜'
            }
          }
          return msg
        })
      })
    } finally {
      setIsTyping(false)
    }
  }

  return (
    <div className="fixed bottom-[88px] right-6 z-[999] flex flex-col items-end gap-3 pointer-events-none font-sans">
      
      {/* Floating Glass Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={containerRef}
            onPointerUp={handlePointerUp}
            drag
            dragListener={false}
            dragMomentum={false}
            dragElastic={0}
            dragControls={dragControls}
            onDragEnd={(event, info) => {
              const newPos = { x: position.x + info.offset.x, y: position.y + info.offset.y }
              setPosition(newPos)
              localStorage.setItem('connectly_ai_friend_pos', JSON.stringify(newPos))
            }}
            style={{
              x: position.x,
              y: position.y,
              width: size.width,
              height: size.height,
              resize: 'both',
              overflow: 'hidden',
              minWidth: '280px',
              minHeight: '350px',
              maxWidth: '600px',
              maxHeight: '800px'
            }}
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="glass dark:glass-dark rounded-2xl shadow-2xl flex flex-col overflow-hidden pointer-events-auto border border-[var(--border)]"
          >
            {/* Header / Drag Handle */}
            <div 
              onPointerDown={(e) => dragControls.start(e)}
              className="px-4 py-3 bg-[var(--card)]/90 border-b border-[var(--border)] flex items-center justify-between flex-shrink-0 cursor-grab active:cursor-grabbing select-none"
            >
              <div className="flex items-center gap-2 pointer-events-none">
                <div className="w-7 h-7 rounded-full bg-[var(--primary)] flex items-center justify-center text-white ai-orb-pulse">
                  <SparklesIcon size={14} className="animate-spin-slow" />
                </div>
                <div className="text-left">
                  <span className="text-xs font-bold text-[var(--text-primary)]">Connectly Friend</span>
                  <div className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                    <span className="text-[9px] text-[var(--text-secondary)] font-medium">Listening</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={handleClearChat}
                  title="Clear Chat Memory"
                  className="text-[var(--text-muted)] hover:text-red-500 transition-colors p-1.5 hover:bg-[var(--hover)] rounded-lg cursor-pointer"
                >
                  <FiTrash2 size={14} />
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors p-1.5 hover:bg-[var(--hover)] rounded-lg cursor-pointer"
                >
                  <FiX size={15} />
                </button>
              </div>
            </div>

            {/* Messages Log */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-transparent scrollbar-none">
              {messages.map((msg) => {
                const isOwn = msg.sender === 'user'
                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col max-w-[85%] ${
                      isOwn ? 'ml-auto items-end' : 'mr-auto items-start'
                    }`}
                  >
                    <div
                      className={`px-3.5 py-2.5 text-xs text-left shadow-sm ${
                        isOwn
                          ? 'bg-gradient-to-r from-[var(--primary)] to-[#A855F7] text-white rounded-2xl rounded-tr-none'
                          : 'bg-[var(--card)]/85 border border-[var(--border)] text-[var(--text-primary)] rounded-2xl rounded-tl-none'
                      }`}
                    >
                      {renderMessageText(msg.text)}
                    </div>
                  </div>
                )
              })}
              
              {/* Typing animation bubble */}
              {isTyping && messages[messages.length - 1]?.text === '' && (
                <div className="flex flex-col items-start mr-auto max-w-[80%]">
                  <div className="px-4 py-3 bg-[var(--card)]/85 border border-[var(--border)] rounded-2xl rounded-tl-none flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[var(--text-muted)] animate-bounce"></span>
                    <span className="w-1.5 h-1.5 rounded-full bg-[var(--text-muted)] animate-bounce [animation-delay:0.2s]"></span>
                    <span className="w-1.5 h-1.5 rounded-full bg-[var(--text-muted)] animate-bounce [animation-delay:0.4s]"></span>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            {/* Input Form */}
            <form
              onSubmit={handleSendMessage}
              className="p-3 bg-[var(--card)]/90 border-t border-[var(--border)] flex items-center gap-2 flex-shrink-0"
            >
              <input
                type="text"
                placeholder="Talk to me..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="flex-1 bg-[var(--input-bg)] border border-[var(--input-border)] rounded-xl py-2 px-3.5 text-xs text-[var(--text-primary)] outline-none focus:border-[var(--primary)] placeholder:text-[var(--text-muted)] font-normal transition-all"
              />
              <button
                type="submit"
                disabled={!input.trim() || isTyping}
                className="p-2 bg-[var(--primary)] hover:opacity-90 disabled:opacity-30 disabled:cursor-not-allowed text-white rounded-xl transition-all cursor-pointer shadow-lg shadow-[var(--primary)]/10"
              >
                <FiSend size={13} />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating launcher button */}
      {!isOpen && (
        <motion.button
          onClick={() => setIsOpen(!isOpen)}
          className="h-12 px-5 rounded-full bg-[var(--card)] border border-[var(--border)] shadow-xl hover:bg-[var(--hover)] flex items-center gap-2.5 pointer-events-auto transition-all cursor-pointer select-none"
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
        >
          <div className="w-5 h-5 rounded-full bg-[var(--primary)] flex items-center justify-center text-white ai-orb-pulse">
            <SparklesIcon size={11} />
          </div>
          <span className="text-xs font-bold text-[var(--text-primary)]">Friend</span>
        </motion.button>
      )}

    </div>
  )
}

export default AIFriendWidget
