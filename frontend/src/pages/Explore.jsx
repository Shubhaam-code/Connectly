import React, { useState, useEffect, useCallback } from "react"
import { useInView } from "react-intersection-observer"
import { AnimatePresence } from "framer-motion"
import { FiSearch, FiFrown, FiWifiOff, FiLoader } from "react-icons/fi"
import Layout from "../components/layout/Layout"
import ExploreCard from "../components/explore/ExploreCard"
import ExploreModal from "../components/explore/ExploreModal"
import axiosInstance from "../lib/axiosInstance"

const CATEGORIES = [
    { name: "Trending", icon: "🔥" },
    { name: "Photos", icon: "📸" },
    { name: "Videos", icon: "🎥" },
    { name: "Cute", icon: "🐶" },
    { name: "Technology", icon: "💻" },
    { name: "Travel", icon: "✈️" }
]

const SkeletonCard = ({ index }) => {
    const val = index % 6
    let heightClass = "h-[160px] sm:h-[220px]"
    if (val === 0 || val === 3) heightClass = "h-[280px] sm:h-[400px]"
    else if (val === 1 || val === 4) heightClass = "h-[220px] sm:h-[300px]"

    return (
        <div 
            className={`bg-[var(--card)] border border-[var(--border)] rounded-2xl animate-pulse flex flex-col justify-end p-4 mb-4 ${heightClass}`}
        >
            <div className="h-4 bg-neutral-800 rounded-md w-3/4 mb-2" />
            <div className="h-3 bg-neutral-800/60 rounded-md w-1/2" />
        </div>
    )
}

const Explore = () => {
    const [items, setItems] = useState([])
    const [page, setPage] = useState(1)
    const [category, setCategory] = useState("Trending")
    const [search, setSearch] = useState("")
    const [debouncedSearch, setDebouncedSearch] = useState("")
    const [loading, setLoading] = useState(true)
    const [loadingMore, setLoadingMore] = useState(false)
    const [hasMore, setHasMore] = useState(true)
    const [error, setError] = useState(null)
    const [activeItem, setActiveItem] = useState(null)

    const { ref, inView } = useInView({
        threshold: 0.1,
        rootMargin: "150px"
    })

    // Debounce search input
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search)
        }, 500)
        return () => clearTimeout(timer)
    }, [search])

    // Fetch feed
    const fetchFeed = useCallback(async (pageNum, activeCategory, searchQuery, isAppend = false) => {
        try {
            if (pageNum === 1) setLoading(true)
            else setLoadingMore(true)
            
            setError(null)

            const response = await axiosInstance.get("/api/explore", {
                params: {
                    page: pageNum,
                    limit: 18,
                    category: activeCategory,
                    search: searchQuery
                }
            })

            const newItems = response.data.feed || []
            
            if (isAppend) {
                setItems(prev => {
                    const existingIds = new Set(prev.map(item => item.id))
                    const filteredNew = newItems.filter(item => !existingIds.has(item.id))
                    return [...prev, ...filteredNew]
                })
            } else {
                setItems(newItems)
            }

            setHasMore(newItems.length >= 18)
        } catch (err) {
            console.error("Failed to load explore feed:", err)
            setError(err.response?.data?.message || "Something went wrong. Please check your connection.")
        } finally {
            setLoading(false)
            setLoadingMore(false)
        }
    }, [])

    // Reload feed when category or debounced search changes
    useEffect(() => {
        setPage(1)
        fetchFeed(1, category, debouncedSearch, false)
    }, [category, debouncedSearch, fetchFeed])

    // Load next page on scroll trigger
    useEffect(() => {
        if (inView && hasMore && !loading && !loadingMore) {
            const nextPage = page + 1
            setPage(nextPage)
            fetchFeed(nextPage, category, debouncedSearch, true)
        }
    }, [inView, hasMore, loading, loadingMore, page, category, debouncedSearch, fetchFeed])

    // Pinterest-style mixed height generator
    const getCardHeightClass = (index) => {
        const val = index % 6
        if (val === 0) return "h-[280px] sm:h-[400px]" // Large hero card
        if (val === 3) return "h-[260px] sm:h-[360px]" // Large card
        if (val === 1 || val === 4) return "h-[220px] sm:h-[300px]" // Medium card
        return "h-[160px] sm:h-[220px]" // Small card
    }

    return (
        <Layout>
            <div className="flex flex-col h-full overflow-hidden bg-[var(--background)] text-[var(--text)]">
                
                {/* Fixed Topbar Navigation */}
                <div className="flex-shrink-0 bg-[var(--background)] border-b border-[var(--border)] px-4 sm:px-6 py-5 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                            <h1 className="text-xl sm:text-2xl font-black tracking-tight bg-gradient-to-r from-[var(--text)] to-[var(--text-secondary)] bg-clip-text text-transparent">
                                EXPLORE
                            </h1>
                            <p className="text-xs text-[var(--text-secondary)] mt-0.5">Discover premium photos and cinematic videos</p>
                        </div>

                        {/* Search Input Field */}
                        <div className="relative w-full sm:max-w-xs md:max-w-sm">
                            <span className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-[var(--text-secondary)]">
                                <FiSearch size={16} />
                            </span>
                            <input
                                type="text"
                                placeholder="Search creators, titles, tags..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full h-11 bg-[var(--card)] border border-[var(--border)] rounded-2xl pl-11 pr-4 text-sm text-[var(--text)] placeholder-[var(--text-secondary)] focus:outline-none focus:border-[var(--primary)] focus:bg-[var(--background)] transition-all"
                            />
                        </div>
                    </div>

                    {/* Categories Bar */}
                    <div className="w-full overflow-x-auto scrollbar-hide py-1">
                        <div className="flex gap-2.5 pb-1 min-w-max">
                            {CATEGORIES.map((cat) => {
                                const active = category === cat.name
                                return (
                                    <button
                                        key={cat.name}
                                        onClick={() => setCategory(cat.name)}
                                        className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                                            active
                                                ? "bg-gradient-to-r from-[#8B5CF6] to-[#EC4899] text-white shadow-[0_4px_12px_rgba(139,92,246,0.3)]"
                                                : "bg-[var(--card)] hover:bg-[var(--hover)] text-[var(--text-secondary)] border border-[var(--border)]"
                                        }`}
                                    >
                                        <span>{cat.icon}</span>
                                        <span>{cat.name}</span>
                                    </button>
                                )
                            })}
                        </div>
                    </div>
                </div>

                {/* Scrollable Feed area */}
                <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 scrollbar-hide">
                    {/* Error State */}
                    {error && (
                        <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                            <FiWifiOff size={48} className="text-rose-500" />
                            <div className="space-y-1">
                                <h3 className="text-lg font-bold text-[var(--text)]">Connection Error</h3>
                                <p className="text-sm text-[var(--text-secondary)] max-w-sm mx-auto">{error}</p>
                            </div>
                            <button 
                                onClick={() => fetchFeed(1, category, debouncedSearch, false)}
                                className="px-6 py-2.5 bg-[var(--primary)] hover:opacity-95 text-white text-xs font-bold rounded-2xl transition-all cursor-pointer"
                            >
                                Try Again
                            </button>
                        </div>
                    )}

                    {/* Empty State */}
                    {!loading && !error && items.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-24 text-center space-y-4">
                            <FiFrown size={48} className="text-[var(--text-secondary)]" />
                            <div>
                                <h3 className="text-lg font-bold text-[var(--text)]">No Results Found</h3>
                                <p className="text-sm text-[var(--text-secondary)] mt-1 max-w-xs">
                                    We couldn't find anything matching "{search}". Try searching something else.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Masonry Columns Grid */}
                    {!error && (
                        <div className="columns-2 sm:columns-3 md:columns-4 gap-4">
                            {/* Loading Initial States */}
                            {loading ? (
                                Array.from({ length: 12 }).map((_, idx) => (
                                    <SkeletonCard key={idx} index={idx} />
                                ))
                            ) : (
                                items.map((item, idx) => (
                                    <ExploreCard
                                        key={item.id}
                                        item={item}
                                        onClick={() => setActiveItem(item)}
                                        gridClass={getCardHeightClass(idx)}
                                    />
                                ))
                            )}
                        </div>
                    )}

                    {/* Infinite Scroll Trigger */}
                    {hasMore && !loading && !error && (
                        <div ref={ref} className="w-full py-8 flex items-center justify-center text-[var(--text-secondary)]">
                            {loadingMore ? (
                                <div className="flex items-center gap-2 text-sm">
                                    <FiLoader size={18} className="animate-spin text-[var(--primary)]" />
                                    <span>Loading discover feed...</span>
                                </div>
                            ) : (
                                <span className="text-xs">Scroll to load more</span>
                            )}
                        </div>
                    )}
                </div>

                {/* Fullscreen Media Viewer Modal */}
                <AnimatePresence>
                    {activeItem && (
                        <ExploreModal
                            item={activeItem}
                            onClose={() => setActiveItem(null)}
                        />
                    )}
                </AnimatePresence>
            </div>
        </Layout>
    )
}

export default Explore
