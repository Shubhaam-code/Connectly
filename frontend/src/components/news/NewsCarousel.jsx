import React, { useState, useEffect, useRef } from 'react'
import { FiChevronRight, FiCompass } from 'react-icons/fi'
import axiosInstance from '../../lib/axiosInstance'
import { formatTime } from '../../utils/formatters'
import NewsModal from './NewsModal'

function NewsCarousel() {
  const [trendingNews, setTrendingNews] = useState([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedArticleIndex, setSelectedArticleIndex] = useState(0)

  const carouselRef = useRef(null)
  const [isDown, setIsDown] = useState(false)
  const [startX, setStartX] = useState(0)
  const [scrollLeft, setScrollLeft] = useState(0)
  const [dragMoved, setDragMoved] = useState(false)

  useEffect(() => {
    let active = true
    const fetchTrendingNews = async () => {
      try {
        const res = await axiosInstance.get('/api/news/trending')
        if (active && res.data && res.data.success) {
          setTrendingNews(res.data.data || [])
        }
      } catch (err) {
        console.error('Error fetching trending news:', err)
      } finally {
        if (active) setLoading(false)
      }
    }
    fetchTrendingNews()
    return () => {
      active = false
    }
  }, [])

  // Mouse drag-to-scroll controls
  const handleMouseDown = (e) => {
    setIsDown(true)
    setDragMoved(false)
    if (!carouselRef.current) return
    setStartX(e.pageX - carouselRef.current.offsetLeft)
    setScrollLeft(carouselRef.current.scrollLeft)
  }

  const handleMouseLeave = () => {
    setIsDown(false)
  }

  const handleMouseUp = () => {
    setIsDown(false)
  }

  const handleMouseMove = (e) => {
    if (!isDown || !carouselRef.current) return
    e.preventDefault()
    const x = e.pageX - carouselRef.current.offsetLeft
    const walk = (x - startX) * 1.5 // drag speed ratio
    if (Math.abs(x - startX) > 6) {
      setDragMoved(true)
    }
    carouselRef.current.scrollLeft = scrollLeft - walk
  }

  // Mouse wheel horizontal scroll conversion
  const handleWheel = (e) => {
    if (carouselRef.current) {
      if (e.deltaY !== 0) {
        // Only override if scroll is mainly vertical
        carouselRef.current.scrollLeft += e.deltaY * 0.8
      }
    }
  }

  const handleCardClick = (idx) => {
    if (dragMoved) return // Skip modal if user was dragging
    setSelectedArticleIndex(idx)
    setIsModalOpen(true)
  }

  if (loading) {
    return (
      <div className="w-full bg-[var(--card)] border border-[var(--border)] rounded-2xl p-4 mb-5 shadow-xl animate-pulse">
        <div className="h-4 w-32 bg-[var(--border)] rounded mb-4"></div>
        <div className="flex gap-4 overflow-hidden">
          {[1, 2, 3].map(i => (
            <div key={i} className="min-w-[280px] h-[160px] bg-[var(--border)] rounded-xl flex-shrink-0"></div>
          ))}
        </div>
      </div>
    )
  }

  if (trendingNews.length === 0) {
    return (
      <div className="w-full bg-[var(--card)] border border-[var(--border)] rounded-2xl p-6 mb-5 shadow-xl text-center select-none border-[var(--border)]">
        <span className="text-2xl mb-2 block">📰</span>
        <p className="text-xs text-[var(--text-secondary)] font-semibold">No news available right now</p>
      </div>
    );
  }

  return (
    <div className="w-full bg-[var(--card)] border border-[var(--border)] rounded-2xl p-4 mb-5 shadow-xl select-none">
      <div className="flex items-center justify-between mb-3 px-1">
        <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] flex items-center gap-1.5">
          <FiCompass className="text-[var(--primary)] text-sm animate-spin-slow" />
          Trending Insights
        </span>
        <button
          onClick={() => {
            setSelectedArticleIndex(0)
            setIsModalOpen(true)
          }}
          className="text-xs font-semibold text-[var(--primary)] hover:opacity-80 transition-opacity flex items-center gap-0.5 cursor-pointer"
        >
          Explore All
          <FiChevronRight size={13} />
        </button>
      </div>

      {/* Horizontally scrollable viewport */}
      <div
        ref={carouselRef}
        onMouseDown={handleMouseDown}
        onMouseLeave={handleMouseLeave}
        onMouseUp={handleMouseUp}
        onMouseMove={handleMouseMove}
        onWheel={handleWheel}
        className={`flex gap-3.5 overflow-x-auto pb-1 scrollbar-none snap-x snap-mandatory ${
          isDown ? 'cursor-grabbing' : 'cursor-grab'
        }`}
        style={{ scrollBehavior: isDown ? 'auto' : 'smooth' }}
      >
        {trendingNews.map((news, idx) => (
          <div
            key={idx}
            onClick={() => handleCardClick(idx)}
            className="min-w-[260px] max-w-[260px] bg-[var(--background-secondary)]/40 border border-[var(--border)] rounded-xl overflow-hidden flex flex-col justify-between p-3 flex-shrink-0 snap-start hover:border-[var(--primary)]/30 group transition-all duration-300 relative cursor-pointer"
          >
            {/* Aspect card top: Thumbnail + tag */}
            <div className="relative w-full h-24 rounded-lg overflow-hidden border border-[var(--border)]/40 bg-[var(--card)] mb-2.5">
              <img
                src={news.image}
                alt=""
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                draggable={false}
              />
              <span className="absolute top-2 left-2 bg-black/45 backdrop-blur-md text-[8px] text-white font-bold tracking-widest px-2 py-0.5 rounded-full border border-white/10 uppercase">
                {news.category}
              </span>
            </div>

            {/* Title & Metadata details */}
            <div className="flex-1 flex flex-col justify-between">
              <h4 className="text-xs font-bold text-[var(--text-primary)] leading-normal line-clamp-2 mb-2 group-hover:text-[var(--primary)] transition-colors select-none">
                {news.title}
              </h4>
              <div className="flex items-center justify-between text-[9px] text-[var(--text-muted)] mt-auto font-medium">
                <span className="truncate max-w-[120px]">{news.source}</span>
                <span>{formatTime(news.publishedAt)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <NewsModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  )
}

export default NewsCarousel
