import React, { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { FiHeart, FiBookmark, FiShare2, FiPlay } from "react-icons/fi"

const ExploreCard = ({ item, onClick, gridClass }) => {
    const [isLiked, setIsLiked] = useState(false)
    const [isSaved, setIsSaved] = useState(false)
    const [likesCount, setLikesCount] = useState(item.trendingScore || 0)
    const [showLikeHeart, setShowLikeHeart] = useState(false)

    // Load Liked/Saved state from localStorage
    useEffect(() => {
        const likedItems = JSON.parse(localStorage.getItem("explore_liked_items") || "[]")
        const savedItems = JSON.parse(localStorage.getItem("explore_saved_items") || "[]")
        setIsLiked(likedItems.includes(item.id))
        setIsSaved(savedItems.includes(item.id))
    }, [item.id])

    const handleLike = (e) => {
        e.stopPropagation()
        const likedItems = JSON.parse(localStorage.getItem("explore_liked_items") || "[]")
        let updated
        if (isLiked) {
            updated = likedItems.filter(id => id !== item.id)
            setLikesCount(prev => Math.max(0, prev - 1))
        } else {
            updated = [...likedItems, item.id]
            setLikesCount(prev => prev + 1)
            // Show splash animation
            setShowLikeHeart(true)
            setTimeout(() => setShowLikeHeart(false), 800)
        }
        localStorage.setItem("explore_liked_items", JSON.stringify(updated))
        setIsLiked(!isLiked)
    }

    const handleSave = (e) => {
        e.stopPropagation()
        const savedItems = JSON.parse(localStorage.getItem("explore_saved_items") || "[]")
        let updated
        if (isSaved) {
            updated = savedItems.filter(id => id !== item.id)
        } else {
            updated = [...savedItems, item.id]
        }
        localStorage.setItem("explore_saved_items", JSON.stringify(updated))
        setIsSaved(!isSaved)
    }

    const handleShare = (e) => {
        e.stopPropagation()
        if (navigator.share) {
            navigator.share({
                title: item.title,
                text: `Check out this ${item.type} by ${item.author} on Connectly Explore!`,
                url: item.video || item.image
            }).catch(console.error)
        } else {
            // Fallback: Copy link to clipboard
            const urlToCopy = item.video || item.image
            navigator.clipboard.writeText(urlToCopy)
            alert("Link copied to clipboard!")
        }
    }

    const handleDoubleTap = () => {
        if (!isLiked) {
            handleLike({ stopPropagation: () => {} })
        } else {
            setShowLikeHeart(true)
            setTimeout(() => setShowLikeHeart(false), 800)
        }
    }

    let lastTap = 0
    const handleTap = () => {
        const now = Date.now()
        if (now - lastTap < 300) {
            handleDoubleTap()
        } else {
            // single tap triggers modal open after delay
            setTimeout(() => {
                const doubleTapTriggered = Date.now() - lastTap < 300
                if (!doubleTapTriggered) {
                    onClick()
                }
            }, 300)
        }
        lastTap = now
    }

    const isTrending = item.trendingScore > 900

    return (
        <div 
            onClick={handleTap}
            className={`relative group overflow-hidden rounded-2xl cursor-pointer bg-[var(--card)] border border-[var(--border)] hover:border-[var(--primary)] transition-all duration-300 break-inside-avoid mb-4 ${gridClass}`}
        >
            {/* Media Rendering */}
            <div className="w-full h-full relative group-hover:scale-[1.02] transition-transform duration-500 ease-out">
                <img
                    src={item.image}
                    alt={item.title}
                    loading="lazy"
                    className="w-full h-full object-cover rounded-2xl"
                />

                {/* Media Badges */}
                <div className="absolute top-3 right-3 z-10 flex gap-2">
                    {item.type === "video" && (
                        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-black/60 backdrop-blur-md rounded-full text-[11px] font-semibold text-white">
                            <FiPlay size={12} className="fill-white" />
                            {item.duration ? `${item.duration}s` : "Video"}
                        </div>
                    )}
                </div>

                {isTrending && (
                    <div className="absolute top-3 left-3 z-10 px-2.5 py-1 bg-gradient-to-r from-amber-500 to-rose-500 rounded-full text-[10px] font-extrabold uppercase tracking-wide text-white shadow-md">
                        🔥 Hot
                    </div>
                )}
            </div>

            {/* Hover details overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-between p-4 z-20">
                <div className="flex justify-end gap-2">
                    <button 
                        onClick={handleSave}
                        className={`p-2 rounded-full backdrop-blur-md transition-colors ${isSaved ? "bg-amber-500 text-white" : "bg-black/45 text-white hover:bg-black/60"}`}
                    >
                        <FiBookmark size={16} className={isSaved ? "fill-white" : ""} />
                    </button>
                    <button 
                        onClick={handleShare}
                        className="p-2 rounded-full bg-black/45 text-white hover:bg-black/60 backdrop-blur-md transition-colors"
                    >
                        <FiShare2 size={16} />
                    </button>
                </div>

                <div className="space-y-1.5">
                    <p className="text-xs text-[var(--text-secondary)] font-medium truncate">@{item.author}</p>
                    <h3 className="text-sm font-semibold text-white line-clamp-2 leading-snug">{item.title}</h3>
                    
                    <div className="flex items-center justify-between pt-1 border-t border-white/10 mt-1">
                        <button 
                            onClick={handleLike}
                            className="flex items-center gap-1.5 text-white hover:text-rose-500 transition-colors text-xs font-semibold"
                        >
                            <FiHeart size={15} className={isLiked ? "fill-rose-500 stroke-rose-500" : ""} />
                            {likesCount.toLocaleString()}
                        </button>
                        
                        <span className="text-[10px] text-white/50 capitalize font-medium">{item.source}</span>
                    </div>
                </div>
            </div>

            {/* Heart Pop Animation on Double Tap */}
            <AnimatePresence>
                {showLikeHeart && (
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.3 }}
                        animate={{ opacity: 1, scale: 1.2 }}
                        exit={{ opacity: 0, scale: 0.5 }}
                        className="absolute inset-0 m-auto w-20 h-20 flex items-center justify-center pointer-events-none z-30"
                    >
                        <FiHeart size={64} className="text-rose-500 fill-rose-500 filter drop-shadow-[0_0_15px_rgba(244,63,94,0.6)]" />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}

export default ExploreCard
