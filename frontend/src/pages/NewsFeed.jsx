import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useInView } from 'react-intersection-observer';
import { FiRefreshCw, FiWifiOff, FiCompass, FiLoader, FiExternalLink, FiChevronDown, FiBookOpen } from 'react-icons/fi';
import Layout from '../components/layout/Layout';
import axiosInstance from '../lib/axiosInstance';
import { formatTime } from '../utils/formatters';
import { motion, AnimatePresence } from 'framer-motion';

const CATEGORIES = [
  { name: 'All', icon: '📰', id: 'all' },
  { name: 'Technology', icon: '💻', id: 'Technology' },
  { name: 'AI', icon: '🤖', id: 'AI' },
  { name: 'Startups', icon: '🚀', id: 'Startups' },
  { name: 'Social Media', icon: '📱', id: 'Social Media' }
];

const SkeletonCard = () => (
  <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-4 mb-4 animate-pulse flex flex-col justify-between h-[280px]">
    <div>
      <div className="w-full aspect-video rounded-xl bg-neutral-800 mb-4" />
      <div className="h-4 bg-neutral-800 rounded-md w-3/4 mb-2" />
      <div className="h-3 bg-neutral-800/60 rounded-md w-1/2" />
    </div>
    <div className="flex justify-between items-center mt-4">
      <div className="h-3 bg-neutral-800 rounded-md w-1/4" />
      <div className="h-3 bg-neutral-800 rounded-md w-1/4" />
    </div>
  </div>
);

function NewsFeed() {
  const [articles, setArticles] = useState([]);
  const [category, setCategory] = useState('all');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedCardIndex, setExpandedCardIndex] = useState(null);

  const { ref, inView } = useInView({
    threshold: 0.1,
    rootMargin: '100px'
  });

  // Fetch articles from /api/news
  const fetchNews = useCallback(async (pageNum, activeCategory, forceRefresh = false, isAppend = false) => {
    try {
      if (pageNum === 1) {
        if (forceRefresh) setRefreshing(true);
        else setLoading(true);
      } else {
        setLoadingMore(true);
      }
      setError(null);

      const params = {
        page: pageNum,
        limit: 6,
        category: activeCategory === 'all' ? undefined : activeCategory,
        refresh: forceRefresh ? 'true' : undefined
      };

      const response = await axiosInstance.get('/api/news', { params });
      const { data, pagination } = response.data;

      if (isAppend) {
        setArticles((prev) => {
          const existingUrls = new Set(prev.map(art => art.url));
          const filteredNew = data.filter(art => !existingUrls.has(art.url));
          return [...prev, ...filteredNew];
        });
      } else {
        setArticles(data || []);
      }

      setHasMore(pageNum < (pagination?.pages || 1));
    } catch (err) {
      console.error('Failed to load news:', err);
      setError(err.response?.data?.message || 'Something went wrong. Please check your connection.');
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
    }
  }, []);

  // Reload feed on category change
  useEffect(() => {
    setPage(1);
    setExpandedCardIndex(null);
    fetchNews(1, category, false, false);
  }, [category, fetchNews]);

  // Load next page on scroll trigger
  useEffect(() => {
    if (inView && hasMore && !loading && !loadingMore && !refreshing) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchNews(nextPage, category, false, true);
    }
  }, [inView, hasMore, loading, loadingMore, refreshing, page, category, fetchNews]);

  // Force Refresh Trigger
  const handleRefresh = () => {
    setPage(1);
    setExpandedCardIndex(null);
    fetchNews(1, category, true, false);
  };

  const toggleExpand = (idx) => {
    setExpandedCardIndex(expandedCardIndex === idx ? null : idx);
  };

  return (
    <Layout>
      <div className="flex flex-col h-full bg-[var(--background)] text-[var(--text)] overflow-hidden">
        
        {/* News Navigation Bar */}
        <div className="flex-shrink-0 border-b border-[var(--border)] px-4 sm:px-6 py-5 bg-[var(--background)]">
          <div className="flex items-center justify-between gap-4 mb-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight flex items-center gap-2 bg-gradient-to-r from-white via-neutral-200 to-neutral-400 bg-clip-text text-transparent">
                <FiBookOpen className="text-purple-500 animate-pulse" />
                CONNECTLY INSIGHTS
              </h1>
              <p className="text-xs text-[var(--text-secondary)] mt-0.5">Premium curated news summarized with Generative AI</p>
            </div>

            {/* Refresh Button */}
            <button
              onClick={handleRefresh}
              disabled={loading || refreshing || loadingMore}
              className="p-2.5 rounded-xl bg-[var(--card)] border border-[var(--border)] text-neutral-400 hover:text-white hover:border-purple-500/30 hover:bg-neutral-900 transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1.5 text-xs font-semibold select-none"
            >
              <FiRefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-purple-400' : ''}`} />
              <span className="hidden sm:inline">Sync Fresh News</span>
            </button>
          </div>

          {/* Categories Pill Switcher */}
          <div className="w-full overflow-x-auto scrollbar-none py-1">
            <div className="flex gap-2.5 pb-1 min-w-max">
              {CATEGORIES.map((cat) => {
                const active = category === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setCategory(cat.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                      active
                        ? 'bg-gradient-to-r from-[#8B5CF6] to-[#EC4899] text-white shadow-[0_4px_12px_rgba(139,92,246,0.3)] scale-105'
                        : 'bg-[var(--card)] hover:bg-[var(--hover)] text-[var(--text-secondary)] border border-[var(--border)] hover:border-white/10'
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

        {/* Scrollable Container */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 scrollbar-none bg-[var(--background-secondary)]/30">
          
          {/* Error Boundary */}
          {error && (
            <div className="flex flex-col items-center justify-center py-20 text-center space-y-4 max-w-md mx-auto">
              <div className="w-16 h-16 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-500">
                <FiWifiOff size={28} />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-white">Connection Error</h3>
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed">{error}</p>
              </div>
              <button
                onClick={handleRefresh}
                className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-[#A855F7] hover:opacity-90 text-xs font-bold rounded-2xl transition-all cursor-pointer shadow-lg shadow-purple-500/10 flex items-center gap-1.5"
              >
                <FiRefreshCw size={13} />
                Try Refreshing
              </button>
            </div>
          )}

          {/* Empty News State */}
          {!loading && !error && articles.length === 0 && (
            <div className="flex flex-col items-center justify-center py-24 text-center space-y-3">
              <span className="text-4xl">📰</span>
              <h3 className="text-base font-bold text-white">No News Found</h3>
              <p className="text-xs text-[var(--text-secondary)] max-w-xs">
                We couldn't retrieve any articles for this category. Press the refresh button to trigger an update.
              </p>
            </div>
          )}

          {/* Cards Grid */}
          {!error && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
              {loading ? (
                Array.from({ length: 6 }).map((_, idx) => <SkeletonCard key={idx} />)
              ) : (
                articles.map((art, idx) => {
                  const isExpanded = expandedCardIndex === idx;
                  return (
                    <div
                      key={art.url || idx}
                      className="bg-[var(--card)] border border-[var(--border)] hover:border-purple-500/20 hover:shadow-[0_4px_30px_rgba(139,92,246,0.06)] rounded-2xl overflow-hidden flex flex-col justify-between group transition-all duration-300 relative"
                    >
                      {/* Image header */}
                      <div className="relative w-full aspect-video rounded-t-xl overflow-hidden bg-neutral-900 border-b border-[var(--border)]">
                        <img
                          src={art.image}
                          alt=""
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 select-none"
                          draggable={false}
                          loading="lazy"
                        />
                        <span className="absolute top-3 left-3 bg-black/45 backdrop-blur-md text-[8px] text-white font-bold tracking-widest px-2.5 py-0.5 rounded-full border border-white/10 uppercase select-none">
                          {art.category}
                        </span>
                      </div>

                      {/* Content block */}
                      <div className="p-4 flex-1 flex flex-col justify-between">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-[9px] text-[var(--text-muted)] font-semibold select-none">
                            <span className="truncate max-w-[150px]">{art.source}</span>
                            <span>{formatTime(art.publishedAt)}</span>
                          </div>
                          <h4 className="text-xs sm:text-sm font-bold text-white leading-snug line-clamp-2 select-text group-hover:text-purple-400 transition-colors">
                            {art.title}
                          </h4>
                          <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed line-clamp-3 select-text">
                            {art.description}
                          </p>
                        </div>

                        {/* Inline AI Summary Panel (Expanded view) */}
                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              transition={{ duration: 0.25 }}
                              className="mt-4 pt-3 border-t border-[var(--border)] bg-neutral-900/40 p-3 rounded-xl border border-white/[0.02] flex flex-col gap-2 overflow-hidden"
                            >
                              <div className="flex items-center gap-1.5 text-[8px] font-bold text-purple-400 uppercase tracking-widest select-none">
                                <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse" />
                                GenAI Summary
                              </div>
                              <p className="text-[11px] text-neutral-300 leading-relaxed font-normal select-text">
                                {art.summary}
                              </p>
                              <a
                                href={art.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="mt-1 flex items-center gap-1 text-[10px] font-bold text-purple-400 hover:text-purple-300 transition-colors self-start select-none"
                              >
                                Read Original Article
                                <FiExternalLink size={10} />
                              </a>
                            </motion.div>
                          )}
                        </AnimatePresence>

                        {/* Expand/Collapse action */}
                        <div className="mt-4 flex items-center justify-between select-none">
                          <button
                            onClick={() => toggleExpand(idx)}
                            className="flex items-center gap-1 text-[10px] font-bold text-neutral-400 hover:text-white transition-all cursor-pointer bg-white/5 border border-white/5 hover:border-purple-500/20 px-3 py-1.5 rounded-xl hover:bg-neutral-900"
                          >
                            <span>{isExpanded ? 'Collapse' : 'View AI Summary'}</span>
                            <FiChevronDown className={`w-3.5 h-3.5 transition-transform duration-300 ${isExpanded ? 'rotate-180 text-purple-400' : ''}`} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* Infinite Scroll Trigger */}
          {hasMore && !loading && !error && (
            <div ref={ref} className="w-full py-8 flex items-center justify-center text-[var(--text-secondary)] select-none">
              {loadingMore ? (
                <div className="flex items-center gap-2 text-xs font-semibold">
                  <FiLoader size={16} className="animate-spin text-purple-500" />
                  <span>Curating more insights...</span>
                </div>
              ) : (
                <span className="text-[10px] tracking-wider text-neutral-500 uppercase">Scroll to read more</span>
              )}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}

export default NewsFeed;
