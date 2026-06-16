import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FiX, FiChevronLeft, FiChevronRight, FiExternalLink, FiCompass } from 'react-icons/fi'
import axiosInstance from '../../lib/axiosInstance'
import { formatTime } from '../../utils/formatters'

const CATEGORIES = [
  { id: 'all', label: 'All' },
  { id: 'Technology', label: 'Technology' },
  { id: 'AI', label: 'AI' },
  { id: 'Startups', label: 'Startups' },
  { id: 'Business', label: 'Business' },
  { id: 'Gaming', label: 'Gaming' },
  { id: 'Sports', label: 'Sports' },
  { id: 'Entertainment', label: 'Entertainment' }
]

function NewsModal({ isOpen, onClose }) {
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [articles, setArticles] = useState([])
  const [activeIndex, setActiveIndex] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [direction, setDirection] = useState(0) // -1 for previous, 1 for next

  useEffect(() => {
    if (!isOpen) return

    const fetchNews = async () => {
      setLoading(true)
      setError(null)
      try {
        let url = '/api/news?limit=40'
        if (selectedCategory !== 'all') {
          url = `/api/news/category?cat=${selectedCategory}&limit=40`
        }
        const res = await axiosInstance.get(url)
        if (res.data && res.data.success) {
          setArticles(res.data.data || [])
          setActiveIndex(0)
        } else {
          setError('No news available right now')
        }
      } catch (err) {
        console.error('Error fetching news:', err)
        setError('No news available right now')
      } finally {
        setLoading(false)
      }
    }

    fetchNews()
  }, [selectedCategory, isOpen])

  // Key navigation for cards
  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowRight') {
        handleNext()
      } else if (e.key === 'ArrowLeft') {
        handlePrev()
      } else if (e.key === 'Escape') {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, articles, activeIndex])

  const handleNext = () => {
    if (articles.length === 0) return
    setDirection(1)
    setActiveIndex((prev) => (prev + 1) % articles.length)
  }

  const handlePrev = () => {
    if (articles.length === 0) return
    setDirection(-1)
    setActiveIndex((prev) => (prev - 1 + articles.length) % articles.length)
  }

  const slideVariants = {
    enter: (dir) => ({
      x: dir > 0 ? 300 : -300,
      opacity: 0
    }),
    center: {
      x: 0,
      opacity: 1
    },
    exit: (dir) => ({
      x: dir < 0 ? 300 : -300,
      opacity: 0
    })
  }

  if (!isOpen) return null

  const currentArticle = articles[activeIndex]

  return (
    <AnimatePresence>
      {/* Background Overlay */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-[900] bg-black/60 backdrop-blur-sm flex justify-end"
      >
        {/* News Drawer Panel */}
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 220 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-[500px] h-full bg-[var(--background)] border-l border-[var(--border)] flex flex-col relative shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="p-4 border-b border-[var(--border)] flex flex-col gap-3 bg-[var(--card)]/80 backdrop-blur-md sticky top-0 z-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FiCompass className="text-xl text-[var(--primary)] animate-pulse" />
                <h2 className="text-lg font-bold text-[var(--text)] tracking-tight">🔥 Connectly News</h2>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-[var(--hover)] text-[var(--text-secondary)] hover:text-[var(--text)] transition-colors border border-[var(--border)]"
              >
                <FiX size={18} />
              </button>
            </div>

            {/* Category selection pills */}
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none snap-x snap-mandatory">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-300 ${
                    selectedCategory === cat.id
                      ? 'bg-[var(--primary)] text-white shadow-lg shadow-[var(--primary)]/20 scale-105'
                      : 'bg-[var(--hover)] text-[var(--text-secondary)] hover:text-[var(--text)] border border-[var(--border)]'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Drawer Body - Article Deck */}
          <div className="flex-1 overflow-y-auto flex flex-col p-5 bg-[var(--background-secondary)] relative">
            {loading ? (
              <div className="flex-1 flex flex-col items-center justify-center gap-4 py-12">
                <div className="w-12 h-12 rounded-full border-4 border-[var(--border)] border-t-[var(--primary)] animate-spin"></div>
                <p className="text-sm text-[var(--text-secondary)] font-medium">Curating summarized insights...</p>
              </div>
            ) : error ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-6 py-20">
                <span className="text-3xl mb-3">⚠️</span>
                <p className="text-sm text-[var(--text-secondary)] mb-4">{error}</p>
                <button
                  onClick={() => setSelectedCategory(selectedCategory)}
                  className="px-4 py-2 bg-[var(--primary)] text-white text-xs font-semibold rounded-lg hover:opacity-90 transition-opacity"
                >
                  Retry
                </button>
              </div>
            ) : articles.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-6 py-20">
                <span className="text-3xl mb-3">📰</span>
                <p className="text-sm text-[var(--text-secondary)]">No news available right now</p>
              </div>
            ) : (
              <div className="flex-1 flex flex-col h-full justify-between">
                {/* News Card Wrapper */}
                <div className="relative flex-1 flex flex-col justify-start">
                  <AnimatePresence initial={false} custom={direction} mode="wait">
                    <motion.div
                      key={activeIndex}
                      custom={direction}
                      variants={slideVariants}
                      initial="enter"
                      animate="center"
                      exit="exit"
                      transition={{ opacity: { duration: 0.2 }, x: { type: 'spring', stiffness: 300, damping: 30 } }}
                      className="w-full flex flex-col gap-4"
                    >
                      {/* Article Image with glass overlay category tag */}
                      <div className="relative w-full aspect-video rounded-xl overflow-hidden shadow-md border border-[var(--border)] group bg-[var(--card)]">
                        <img
                          src={currentArticle.image}
                          alt={currentArticle.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                        />
                        <div className="absolute top-3 left-3 bg-black/40 backdrop-blur-md text-white text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-full border border-white/10">
                          {currentArticle.category}
                        </div>
                      </div>

                      {/* Title & Metadata */}
                      <div className="flex flex-col gap-1.5">
                        <h3 className="text-base font-bold text-[var(--text)] leading-snug">
                          {currentArticle.title}
                        </h3>
                        <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
                          <span className="font-semibold text-[var(--text)]">{currentArticle.source}</span>
                          <span>•</span>
                          <span>{formatTime(currentArticle.publishedAt)}</span>
                        </div>
                      </div>

                      {/* Divider */}
                      <div className="h-[1px] bg-gradient-to-r from-transparent via-[var(--border)] to-transparent my-1"></div>

                      {/* GenAI Summary Body */}
                      <div className="flex flex-col gap-3">
                        <span className="text-[10px] font-bold text-[var(--primary)] uppercase tracking-widest flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-[var(--primary)] animate-pulse"></span>
                          Gemini 1.5-flash Summary
                        </span>
                        <p className="text-xs text-[var(--text-secondary)] leading-relaxed font-normal bg-[var(--card)] p-4 rounded-xl border border-[var(--border)] select-text">
                          {currentArticle.summary}
                        </p>
                      </div>
                    </motion.div>
                  </AnimatePresence>
                </div>

                {/* Bottom Card Navigation & External Link */}
                <div className="mt-6 pt-4 border-t border-[var(--border)] flex flex-col gap-4 sticky bottom-0 bg-[var(--background-secondary)]">
                  {/* Read original link */}
                  {currentArticle && (
                    <a
                      href={currentArticle.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-2.5 rounded-xl border border-[var(--border)] hover:bg-[var(--hover)] text-xs text-[var(--text)] font-semibold flex items-center justify-center gap-2 transition-all"
                    >
                      <span>Read full story at {currentArticle.source}</span>
                      <FiExternalLink size={13} />
                    </a>
                  )}

                  {/* Navigation Button Controls */}
                  <div className="flex items-center justify-between px-1">
                    <button
                      onClick={handlePrev}
                      className="w-10 h-10 rounded-full flex items-center justify-center bg-[var(--card)] border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text)] hover:bg-[var(--hover)] active:scale-95 transition-all"
                      title="Previous (Left Arrow)"
                    >
                      <FiChevronLeft size={20} />
                    </button>
                    <span className="text-xs text-[var(--text-secondary)] font-medium">
                      {activeIndex + 1} of {articles.length}
                    </span>
                    <button
                      onClick={handleNext}
                      className="w-10 h-10 rounded-full flex items-center justify-center bg-[var(--card)] border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text)] hover:bg-[var(--hover)] active:scale-95 transition-all"
                      title="Next (Right Arrow)"
                    >
                      <FiChevronRight size={20} />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

export default NewsModal
