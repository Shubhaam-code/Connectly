import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiChevronLeft, FiChevronRight, FiExternalLink, FiCompass } from 'react-icons/fi';
import axiosInstance from '../../lib/axiosInstance';
import { formatTime } from '../../utils/formatters';

const CATEGORIES = [
  { id: 'all', label: 'All' },
  { id: 'Technology', label: 'Technology' },
  { id: 'AI', label: 'AI' },
  { id: 'Startups', label: 'Startups' },
  { id: 'Business', label: 'Business' }
];

function NewsModal({ isOpen, onClose }) {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [articles, setArticles] = useState([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [direction, setDirection] = useState(0); // -1 for previous, 1 for next

  useEffect(() => {
    if (!isOpen) return;

    const fetchNews = async () => {
      setLoading(true);
      setError(null);
      try {
        let url = '/api/news?limit=40';
        if (selectedCategory !== 'all') {
          url = `/api/news/category?cat=${selectedCategory}&limit=40`;
        }
        const res = await axiosInstance.get(url);
        if (res.data && res.data.success) {
          setArticles(res.data.data || []);
          setActiveIndex(0);
        } else {
          setError('No news available right now');
        }
      } catch (err) {
        console.error('Error fetching news:', err);
        setError('No news available right now');
      } finally {
        setLoading(false);
      }
    };

    fetchNews();
  }, [selectedCategory, isOpen]);

  // Key navigation for cards
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowRight') {
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      } else if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, articles, activeIndex]);

  const handleNext = () => {
    if (articles.length === 0) return;
    setDirection(1);
    setActiveIndex((prev) => (prev + 1) % articles.length);
  };

  const handlePrev = () => {
    if (articles.length === 0) return;
    setDirection(-1);
    setActiveIndex((prev) => (prev - 1 + articles.length) % articles.length);
  };

  const slideVariants = {
    enter: (dir) => ({
      x: dir > 0 ? 150 : -150,
      opacity: 0,
      scale: 0.98
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1
    },
    exit: (dir) => ({
      x: dir < 0 ? 150 : -150,
      opacity: 0,
      scale: 0.98
    })
  };

  if (!isOpen) return null;

  const currentArticle = articles[activeIndex];

  return (
    <AnimatePresence>
      {/* Centered Modal Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-[900] bg-black/75 backdrop-blur-md flex items-center justify-center p-0 md:p-6"
      >
        {/* Centered Premium Dark Glassmorphism Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          onClick={(e) => e.stopPropagation()}
          className="w-full h-[100dvh] md:h-[80vh] md:max-h-[750px] md:max-w-[960px] bg-[#0c0c0e]/95 backdrop-blur-2xl border-0 md:border md:border-white/10 shadow-2xl relative flex flex-col md:rounded-[24px] overflow-hidden text-[var(--text)] select-none"
        >
          {/* Header Area */}
          <div className="p-5 md:p-6 border-b border-white/5 flex flex-col gap-4 bg-black/30 backdrop-blur-md sticky top-0 z-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#8B5CF6] to-[#EC4899] flex items-center justify-center text-white shadow-lg shadow-purple-500/10">
                  <FiCompass className="text-base animate-spin-slow" />
                </div>
                <h2 className="text-lg md:text-xl font-black text-white tracking-tight uppercase">
                  🔥 Connectly News
                </h2>
              </div>
              <button
                onClick={onClose}
                className="w-9 h-9 rounded-full flex items-center justify-center bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white transition-all border border-white/5 active:scale-95 cursor-pointer"
              >
                <FiX size={18} />
              </button>
            </div>

            {/* Horizontal Category Chips */}
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none snap-x snap-mandatory">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-4.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all duration-300 cursor-pointer border ${
                    selectedCategory === cat.id
                      ? 'bg-gradient-to-r from-[#8B5CF6] to-[#EC4899] text-white border-transparent shadow-lg shadow-purple-500/20 scale-105'
                      : 'bg-white/5 text-neutral-400 hover:text-white border-white/5 hover:bg-white/10'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Modal Content - Dynamic Card */}
          <div className="flex-1 overflow-y-auto p-5 md:p-8 flex flex-col bg-transparent relative">
            {loading ? (
              <div className="flex-1 flex flex-col items-center justify-center gap-4 py-20">
                <div className="w-12 h-12 rounded-full border-[3px] border-white/10 border-t-[#8B5CF6] animate-spin"></div>
                <p className="text-xs text-neutral-400 font-semibold tracking-wider uppercase">Curating dynamic summaries...</p>
              </div>
            ) : error ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-6 py-20">
                <span className="text-4xl mb-4">⚠️</span>
                <p className="text-sm text-neutral-300 font-medium mb-5">{error}</p>
                <button
                  onClick={() => setSelectedCategory(selectedCategory)}
                  className="px-5 py-2.5 bg-gradient-to-r from-[#8B5CF6] to-[#EC4899] text-white text-xs font-bold rounded-xl hover:opacity-90 active:scale-95 transition-all cursor-pointer shadow-lg shadow-purple-500/10"
                >
                  Retry
                </button>
              </div>
            ) : articles.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-6 py-20">
                <span className="text-4xl mb-4">📰</span>
                <p className="text-sm text-neutral-400 font-bold tracking-wider uppercase">No news available in this category</p>
              </div>
            ) : (
              <div className="flex-1 flex flex-col justify-between h-full">
                
                {/* News Card Split Grid */}
                <div className="relative flex-1 flex flex-col justify-start">
                  <AnimatePresence initial={false} custom={direction} mode="wait">
                    <motion.div
                      key={activeIndex}
                      custom={direction}
                      variants={slideVariants}
                      initial="enter"
                      animate="center"
                      exit="exit"
                      transition={{ opacity: { duration: 0.18 }, x: { type: 'spring', stiffness: 350, damping: 32 } }}
                      className="w-full flex flex-col md:flex-row gap-6 md:gap-8 items-stretch"
                    >
                      {/* Left: Aspect Media Card */}
                      <div className="w-full md:w-[45%] aspect-video md:aspect-[4/3] rounded-2xl overflow-hidden border border-white/10 bg-black/25 relative group flex-shrink-0">
                        <img
                          src={currentArticle.image}
                          alt={currentArticle.title}
                          className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-700"
                        />
                        <div className="absolute top-3.5 left-3.5 bg-black/60 backdrop-blur-md text-[9px] uppercase font-black tracking-widest px-3 py-1 rounded-full border border-white/10 text-purple-300 shadow">
                          {currentArticle.category}
                        </div>
                      </div>

                      {/* Right: Metadata + Title + Summary + Button */}
                      <div className="flex-1 flex flex-col justify-between gap-5 text-left">
                        <div className="space-y-3">
                          {/* Metadata */}
                          <div className="flex items-center gap-2 text-[10px] md:text-xs text-neutral-400 font-semibold uppercase tracking-wider">
                            <span className="text-neutral-200">{currentArticle.source}</span>
                            <span>•</span>
                            <span>{formatTime(currentArticle.publishedAt)}</span>
                          </div>

                          {/* Title */}
                          <h3 className="text-lg md:text-xl font-black text-white leading-snug tracking-tight hover:text-purple-400 transition-colors">
                            {currentArticle.title}
                          </h3>

                          {/* Summary Capsule */}
                          <div className="flex flex-col gap-2 mt-4">
                            <span className="text-[9px] font-black text-[#8B5CF6] uppercase tracking-widest flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#EC4899] animate-pulse"></span>
                              AI Companion Summary
                            </span>
                            <div className="text-xs md:text-sm text-neutral-300 leading-relaxed font-normal bg-white/5 border border-white/5 p-4 md:p-5 rounded-2xl select-text overflow-y-auto max-h-[160px] md:max-h-[220px] scrollbar-none shadow-inner">
                              {currentArticle.summary}
                            </div>
                          </div>
                        </div>

                        {/* Read Full Story Button */}
                        {currentArticle && (
                          <a
                            href={currentArticle.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#8B5CF6] to-[#EC4899] hover:opacity-95 text-xs text-white font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-lg shadow-purple-500/15 cursor-pointer"
                          >
                            <span>Read full story at {currentArticle.source}</span>
                            <FiExternalLink size={14} />
                          </a>
                        )}
                      </div>
                    </motion.div>
                  </AnimatePresence>
                </div>

                {/* Card Navigation Controls */}
                <div className="mt-8 pt-4 border-t border-white/5 flex items-center justify-between sticky bottom-0 bg-transparent">
                  <button
                    onClick={handlePrev}
                    className="w-11 h-11 rounded-full flex items-center justify-center bg-white/5 border border-white/5 text-neutral-400 hover:text-white hover:bg-white/10 active:scale-90 transition-all cursor-pointer"
                    title="Previous (Left Arrow)"
                  >
                    <FiChevronLeft size={22} />
                  </button>
                  <span className="text-xs text-neutral-400 font-bold uppercase tracking-wider">
                    {activeIndex + 1} of {articles.length}
                  </span>
                  <button
                    onClick={handleNext}
                    className="w-11 h-11 rounded-full flex items-center justify-center bg-white/5 border border-white/5 text-neutral-400 hover:text-white hover:bg-white/10 active:scale-90 transition-all cursor-pointer"
                    title="Next (Right Arrow)"
                  >
                    <FiChevronRight size={22} />
                  </button>
                </div>

              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export default NewsModal;
