import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiX, 
  FiChevronLeft, 
  FiChevronRight, 
  FiExternalLink, 
  FiCompass, 
  FiBookOpen 
} from 'react-icons/fi';
import Layout from '../components/layout/Layout';
import axiosInstance from '../lib/axiosInstance';
import { formatTime } from '../utils/formatters';

const CATEGORIES = [
  { name: 'All', icon: '📰', id: 'all' },
  { name: 'Technology', icon: '💻', id: 'Technology' },
  { name: 'AI', icon: '🤖', id: 'AI' },
  { name: 'Startups', icon: '🚀', id: 'Startups' },
  { name: 'Business', icon: '💼', id: 'Business' }
];

function NewsFeed() {
  const navigate = useNavigate();
  const location = useLocation();

  // Read router state
  const initialArticles = location.state?.initialArticles || null;
  const initialIndex = location.state?.initialIndex || 0;

  const [category, setCategory] = useState('all');
  const [articles, setArticles] = useState([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [direction, setDirection] = useState(0); // -1 for previous, 1 for next

  // Freeze background scrolling when page is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  // Handle initial input articles
  useEffect(() => {
    if (initialArticles) {
      setArticles(initialArticles);
      setActiveIndex(initialIndex);
    }
  }, [initialArticles, initialIndex]);

  // Fetch news from API if no initialArticles or if category is changed
  useEffect(() => {
    // If we have initialArticles and we are on 'all' category, don't fetch initially
    if (initialArticles && category === 'all' && articles.length > 0) return;

    const fetchNews = async () => {
      setLoading(true);
      setError(null);
      try {
        let url = '/api/news?limit=40';
        if (category !== 'all') {
          url = `/api/news/category?cat=${category}&limit=40`;
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
  }, [category, initialArticles]);

  // Key navigation for cards
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowRight') {
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      } else if (e.key === 'Escape') {
        handleClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [articles, activeIndex]);

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

  const handleClose = () => {
    if (window.history.state && window.history.state.idx > 0) {
      navigate(-1);
    } else {
      navigate('/');
    }
  };

  const slideVariants = {
    enter: (dir) => ({
      x: dir > 0 ? 100 : -100,
      opacity: 0,
      scale: 0.98
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1
    },
    exit: (dir) => ({
      x: dir < 0 ? 100 : -100,
      opacity: 0,
      scale: 0.98
    })
  };

  const currentArticle = articles[activeIndex];

  return (
    <Layout>
      {/* Full-screen backdrop overlay */}
      <div className="fixed inset-0 z-[9999] bg-black/75 dark:bg-[#060B13]/95 backdrop-blur-2xl flex items-center justify-center overflow-hidden w-screen h-screen">
        
        {/* News Card Container */}
        <div className="w-full h-full md:w-[85vw] md:max-w-[1200px] md:h-[85vh] md:max-h-[800px] bg-[var(--card)] border-0 md:border border-[var(--border)] shadow-[0_24px_60px_rgba(0,0,0,0.6)] relative flex flex-col rounded-none md:rounded-[32px] overflow-hidden text-[var(--text)] select-none">
          
          {/* Header */}
          <div className="p-4 md:p-6 border-b border-[var(--border)] flex flex-col gap-4 bg-[var(--card)]/80 backdrop-blur-md flex-shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8.5 h-8.5 rounded-xl bg-gradient-to-tr from-[#8B5CF6] to-[#EC4899] flex items-center justify-center text-white shadow-lg shadow-purple-500/20">
                  <FiCompass className="text-base animate-spin-slow" />
                </div>
                <div>
                  <h2 className="text-xs md:text-sm font-extrabold text-white tracking-widest uppercase flex items-center gap-1.5">
                    🔥 Connectly News
                  </h2>
                  <p className="text-[10px] text-[var(--text-secondary)] font-medium">Summarized by Generative AI</p>
                </div>
              </div>
              
              {/* Close/Back Button */}
              <button
                onClick={handleClose}
                className="w-10 h-10 rounded-full flex items-center justify-center bg-[var(--background-secondary)] hover:bg-[var(--hover)] text-[var(--text-secondary)] hover:text-white transition-all border border-[var(--border)] active:scale-95 cursor-pointer"
                title="Go Back"
              >
                <FiX size={20} />
              </button>
            </div>

            {/* Categories */}
            <div className="w-full overflow-x-auto scrollbar-none py-1">
              <div className="flex gap-2 min-w-max">
                {CATEGORIES.map((cat) => {
                  const active = category === cat.id;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => setCategory(cat.id)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-[11px] font-black tracking-wide whitespace-nowrap transition-all duration-300 cursor-pointer border ${
                        active
                          ? 'bg-gradient-to-r from-[#8B5CF6] to-[#EC4899] text-white border-transparent shadow-lg shadow-purple-500/20 scale-105'
                          : 'bg-[var(--background-secondary)] text-[var(--text-secondary)] border-[var(--border)] hover:text-white hover:bg-[var(--hover)]'
                      }`}
                    >
                      <span>{cat.icon}</span>
                      <span>{cat.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden p-5 md:p-8 flex flex-col bg-transparent relative scrollbar-none min-h-0">
            {loading ? (
              <div className="flex-1 flex flex-col items-center justify-center gap-4 py-20">
                <div className="w-12 h-12 rounded-full border-[3px] border-[var(--border)] border-t-[#8B5CF6] animate-spin"></div>
                <p className="text-xs text-[var(--text-secondary)] font-semibold tracking-wider uppercase">Curating summaries...</p>
              </div>
            ) : error ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-6 py-20">
                <span className="text-4xl mb-4">⚠️</span>
                <p className="text-sm text-[var(--text-secondary)] font-medium mb-5">{error}</p>
                <button
                  onClick={() => setCategory(category)}
                  className="px-5 py-2.5 bg-gradient-to-r from-[#8B5CF6] to-[#EC4899] text-white text-xs font-bold rounded-xl hover:opacity-90 active:scale-95 transition-all cursor-pointer shadow-lg shadow-purple-500/10"
                >
                  Retry
                </button>
              </div>
            ) : articles.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-6 py-20">
                <span className="text-4xl mb-4">📰</span>
                <p className="text-sm text-[var(--text-secondary)] font-bold tracking-wider uppercase">No news available in this category</p>
              </div>
            ) : (
              <div className="relative flex-1 flex flex-col justify-start">
                <AnimatePresence initial={false} custom={direction} mode="wait">
                  <motion.div
                    key={activeIndex}
                    custom={direction}
                    variants={slideVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{ opacity: { duration: 0.15 }, x: { type: 'spring', stiffness: 380, damping: 35 } }}
                    className="w-full flex flex-col md:flex-row gap-6 md:gap-8 items-stretch"
                  >
                    {/* Left Column: Media */}
                    <div className="w-full md:w-[45%] h-56 md:h-[400px] rounded-2xl overflow-hidden border border-[var(--border)] bg-[var(--background-secondary)]/30 relative flex-shrink-0">
                      <img
                        src={currentArticle.image}
                        alt={currentArticle.title}
                        className="w-full h-full object-cover"
                      />
                      <span className="absolute top-3.5 left-3.5 bg-black/60 backdrop-blur-md text-[9px] uppercase font-black tracking-widest px-3 py-1 rounded-full border border-white/10 text-purple-300 shadow">
                        {currentArticle.category}
                      </span>
                    </div>

                    {/* Right Column: News Content */}
                    <div className="flex-1 flex flex-col justify-between md:h-[400px] text-left w-full min-w-0">
                      <div className="space-y-3.5">
                        {/* Metadata */}
                        <div className="flex items-center gap-2 text-[10px] md:text-xs text-[var(--text-muted)] font-bold uppercase tracking-wider">
                          <span className="text-[var(--text-secondary)]">{currentArticle.source}</span>
                          <span>•</span>
                          <span>{formatTime(currentArticle.publishedAt)}</span>
                        </div>

                        {/* Title */}
                        <h3 className="text-base md:text-lg lg:text-xl font-black text-white leading-snug tracking-tight hover:text-[#8B5CF6] transition-colors select-text">
                          {currentArticle.title}
                        </h3>

                        {/* AI Summary card */}
                        <div className="flex flex-col gap-2.5 bg-[var(--background-secondary)]/40 border border-[var(--border)] p-4 md:p-5 rounded-2xl shadow-inner select-text backdrop-blur-md">
                          <span className="text-[9px] font-black text-[#8B5CF6] uppercase tracking-widest flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#EC4899] animate-pulse"></span>
                            AI Companion Summary
                          </span>
                          <div className="text-xs md:text-sm text-[var(--text-secondary)] leading-relaxed font-normal">
                            {currentArticle.summary}
                          </div>
                        </div>
                      </div>

                      {/* Read Full Story Button */}
                      {currentArticle && (
                        <div className="mt-5 flex-shrink-0">
                          <a
                            href={currentArticle.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#8B5CF6] to-[#EC4899] hover:opacity-95 text-xs text-white font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-lg shadow-purple-500/15 cursor-pointer"
                          >
                            <span>Read full story at {currentArticle.source}</span>
                            <FiExternalLink size={14} />
                          </a>
                        </div>
                      )}
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>
            )}
          </div>

          {/* Footer Controls Area */}
          {!loading && !error && articles.length > 0 && (
            <div className="px-5 py-4 border-t border-[var(--border)] flex items-center justify-between bg-[var(--card)]/95 backdrop-blur-md z-10 flex-shrink-0">
              <button
                onClick={handlePrev}
                className="w-11 h-11 rounded-full flex items-center justify-center bg-[var(--background-secondary)] border border-[var(--border)] text-[var(--text-secondary)] hover:text-white hover:bg-[var(--hover)] active:scale-90 transition-all cursor-pointer"
                title="Previous (Left Arrow)"
              >
                <FiChevronLeft size={22} />
              </button>
              
              <span className="text-xs text-[var(--text-secondary)] font-bold uppercase tracking-widest">
                {activeIndex + 1} of {articles.length}
              </span>
              
              <button
                onClick={handleNext}
                className="w-11 h-11 rounded-full flex items-center justify-center bg-[var(--background-secondary)] border border-[var(--border)] text-[var(--text-secondary)] hover:text-white hover:bg-[var(--hover)] active:scale-90 transition-all cursor-pointer"
                title="Next (Right Arrow)"
              >
                <FiChevronRight size={22} />
              </button>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}

export default NewsFeed;
