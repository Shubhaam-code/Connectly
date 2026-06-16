import React, { useState, useEffect, useRef } from "react"
import { motion } from "framer-motion"
import { FiX, FiHeart, FiBookmark, FiShare2, FiVolume2, FiVolumeX, FiSend } from "react-icons/fi"
import { FaUnsplash } from "react-icons/fa"
import { SiPexels } from "react-icons/si"
import dp from "../../assets/dp.webp"

const ExploreModal = ({ item, onClose }) => {
    const [isLiked, setIsLiked] = useState(false)
    const [isSaved, setIsSaved] = useState(false)
    const [likesCount, setLikesCount] = useState(item.trendingScore || 0)
    const [isMuted, setIsMuted] = useState(true)
    const [newComment, setNewComment] = useState("")
    const [comments, setComments] = useState([])
    const videoRef = useRef(null)

    // Load initial state
    useEffect(() => {
        const likedItems = JSON.parse(localStorage.getItem("explore_liked_items") || "[]")
        const savedItems = JSON.parse(localStorage.getItem("explore_saved_items") || "[]")
        const localComments = JSON.parse(localStorage.getItem(`explore_comments_${item.id}`) || "[]")

        setIsLiked(likedItems.includes(item.id))
        setIsSaved(savedItems.includes(item.id))

        // Set up initial simulated comments if none exist
        if (localComments.length === 0) {
            const initialComments = [
                { id: 1, author: "ashish_coder", text: "Wow, this looks absolutely spectacular! 🚀" },
                { id: 2, author: "sneha_art", text: "Love the color grading and general vibe here." },
                { id: 3, author: "rahul_vlogs", text: "Adding this to my bucket list immediately!" }
            ]
            setComments(initialComments)
            localStorage.setItem(`explore_comments_${item.id}`, JSON.stringify(initialComments))
        } else {
            setComments(localComments)
        }
    }, [item.id])

    const handleLike = () => {
        const likedItems = JSON.parse(localStorage.getItem("explore_liked_items") || "[]")
        let updated
        if (isLiked) {
            updated = likedItems.filter(id => id !== item.id)
            setLikesCount(prev => Math.max(0, prev - 1))
        } else {
            updated = [...likedItems, item.id]
            setLikesCount(prev => prev + 1)
        }
        localStorage.setItem("explore_liked_items", JSON.stringify(updated))
        setIsLiked(!isLiked)
    }

    const handleSave = () => {
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

    const handleShare = () => {
        const url = item.video || item.image
        if (navigator.share) {
            navigator.share({
                title: item.title,
                text: item.title,
                url
            }).catch(console.error)
        } else {
            navigator.clipboard.writeText(url)
            alert("Copied link to clipboard!")
        }
    }

    const handleAddComment = (e) => {
        e.preventDefault()
        if (!newComment.trim()) return

        const updatedComments = [
            ...comments,
            {
                id: Date.now(),
                author: "you",
                text: newComment.trim()
            }
        ]
        setComments(updatedComments)
        localStorage.setItem(`explore_comments_${item.id}`, JSON.stringify(updatedComments))
        setNewComment("")
    }

    const toggleMute = (e) => {
        e.stopPropagation()
        if (videoRef.current) {
            videoRef.current.muted = !videoRef.current.muted
            setIsMuted(videoRef.current.muted)
        }
    }

    return (
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6 bg-black/90 backdrop-blur-md"
            onClick={onClose}
        >
            {/* Modal Box */}
            <motion.div 
                initial={{ scale: 0.95, y: 15 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, y: 15 }}
                transition={{ type: "spring", damping: 25, stiffness: 220 }}
                className="relative bg-[var(--card)] border border-[var(--border)] w-full max-w-5xl h-[85vh] rounded-3xl flex flex-col md:flex-row overflow-hidden shadow-2xl"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Close Button */}
                <button 
                    onClick={onClose}
                    className="absolute top-4 right-4 z-40 p-2.5 rounded-full bg-black/60 hover:bg-black/80 text-white border border-white/10 transition-colors"
                >
                    <FiX size={18} />
                </button>

                {/* Left Side: Media content */}
                <div className="w-full md:w-[60%] bg-black flex items-center justify-center relative h-[45%] md:h-full">
                    {item.type === "video" ? (
                        <div className="relative w-full h-full flex items-center justify-center">
                            <video
                                ref={videoRef}
                                src={item.video}
                                poster={item.image}
                                autoPlay
                                loop
                                muted={isMuted}
                                playsInline
                                className="w-full h-full object-contain"
                            />
                            {/* Mute Button */}
                            <button
                                onClick={toggleMute}
                                className="absolute bottom-4 right-4 z-30 p-2.5 rounded-full bg-black/60 hover:bg-black/85 text-white transition-colors"
                            >
                                {isMuted ? <FiVolumeX size={18} /> : <FiVolume2 size={18} />}
                            </button>
                        </div>
                    ) : (
                        <img
                            src={item.image}
                            alt={item.title}
                            className="w-full h-full object-contain"
                        />
                    )}

                    {/* Source Indicator */}
                    <div className="absolute top-4 left-4 flex items-center gap-1.5 px-3 py-1.5 bg-black/60 backdrop-blur-md border border-white/10 rounded-full text-xs font-semibold text-white">
                        {item.source === "unsplash" && <FaUnsplash size={13} className="text-white" />}
                        {item.source === "pexels" && <SiPexels size={13} className="text-[#05a081]" />}
                        <span className="capitalize">{item.source}</span>
                    </div>
                </div>

                {/* Right Side: Details and Interactions */}
                <div className="w-full md:w-[40%] flex flex-col justify-between border-t md:border-t-0 md:border-l border-[var(--border)] h-[55%] md:h-full bg-[var(--card)]">
                    
                    {/* Header */}
                    <div className="p-4 border-b border-[var(--border)] flex items-center gap-3">
                        <img 
                            src={dp} 
                            alt="author avatar" 
                            className="w-9 h-9 rounded-full object-cover border border-[var(--border)]"
                        />
                        <div>
                            <p className="text-sm font-bold text-[var(--text)] leading-tight">{item.author}</p>
                            <span className="text-[10px] text-[var(--text-secondary)]">Connectly Creator</span>
                        </div>
                    </div>

                    {/* Content Area / Title / Comments */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        <div>
                            <h2 className="text-sm font-semibold text-[var(--text)] leading-relaxed">{item.title}</h2>
                            <p className="text-[10px] text-[var(--text-secondary)] mt-1">
                                Published {new Date(item.createdAt).toLocaleDateString()}
                            </p>
                        </div>

                        {/* Comments Block */}
                        <div className="pt-3 border-t border-[var(--border)] space-y-3">
                            <h4 className="text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">Comments</h4>
                            {comments.map((comment) => (
                                <div key={comment.id} className="text-xs leading-normal flex gap-2">
                                    <span className="font-bold text-[var(--text)]">{comment.author}:</span>
                                    <span className="text-[var(--text-secondary)]">{comment.text}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="p-4 border-t border-[var(--border)] space-y-3 bg-[var(--background)]/10">
                        {/* Interactive Buttons */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <button 
                                    onClick={handleLike}
                                    className="p-1 text-[var(--text)] hover:text-rose-500 transition-colors"
                                >
                                    <FiHeart size={22} className={isLiked ? "fill-rose-500 stroke-rose-500" : ""} />
                                </button>
                                <button 
                                    onClick={handleShare}
                                    className="p-1 text-[var(--text)] hover:text-[var(--primary)] transition-colors"
                                >
                                    <FiShare2 size={22} />
                                </button>
                            </div>
                            <button 
                                onClick={handleSave}
                                className="p-1 text-[var(--text)] hover:text-amber-500 transition-colors"
                            >
                                <FiBookmark size={22} className={isSaved ? "fill-amber-500 stroke-amber-500" : ""} />
                            </button>
                        </div>

                        {/* Likes counter */}
                        <p className="text-xs font-bold text-[var(--text)]">
                            {likesCount.toLocaleString()} likes
                        </p>

                        {/* Add Comment Input Form */}
                        <form onSubmit={handleAddComment} className="flex gap-2 pt-1">
                            <input
                                type="text"
                                placeholder="Add a comment..."
                                value={newComment}
                                onChange={(e) => setNewComment(e.target.value)}
                                className="flex-1 bg-[var(--background)] border border-[var(--border)] rounded-xl px-3 py-2 text-xs text-[var(--text)] placeholder-[var(--text-secondary)] focus:outline-none focus:border-[var(--primary)] transition-all"
                            />
                            <button
                                type="submit"
                                className="p-2 bg-[var(--primary)] hover:opacity-90 text-white rounded-xl transition-colors flex items-center justify-center"
                            >
                                <FiSend size={14} />
                            </button>
                        </form>
                    </div>

                </div>
            </motion.div>
        </motion.div>
    )
}

export default ExploreModal
