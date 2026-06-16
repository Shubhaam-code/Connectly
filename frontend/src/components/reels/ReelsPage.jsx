import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiHeart,
  FiMessageCircle,
  FiShare2,
  FiBookmark,
  FiUser,
  FiFollowX,
} from "react-icons/fi";
import { Avatar, Button } from "../ui/UIComponents";
import { formatTime } from "../../utils/formatters";

export const ReelPlayer = ({
  reel,
  isActive,
  onLike,
  onComment,
  onShare,
  onFollow,
}) => {
  const [liked, setLiked] = useState(reel?.liked || false);
  const [saved, setSaved] = useState(reel?.saved || false);
  const videoRef = useRef(null);

  useEffect(() => {
    if (isActive && videoRef.current) {
      videoRef.current.play().catch(() => {
        // Autoplay may be blocked, silently handle
      });
    } else if (videoRef.current) {
      videoRef.current.pause();
    }
  }, [isActive]);

  const handleLike = () => {
    setLiked(!liked);
    onLike?.(reel._id);
  };

  return (
    <motion.div
      className="relative w-full h-screen bg-black overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Video */}
      <video
        ref={videoRef}
        src={reel.video}
        className="w-full h-full object-cover"
        loop
        muted
        playsInline
      />

      {/* Gradient overlays */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 right-0 h-20 bg-gradient-to-b from-black to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-black to-transparent" />
      </div>

      {/* User info - Top */}
      <motion.div
        className="absolute top-6 left-4 right-4 flex items-center space-x-3 z-20"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Avatar src={reel.creator?.profilePic} alt={reel.creator?.username} size="md" />
        <div className="flex-1">
          <p className="text-white font-semibold">{reel.creator?.username}</p>
          <p className="text-white text-xs opacity-75">{formatTime(reel.createdAt)}</p>
        </div>
        <Button
          size="sm"
          onClick={() => onFollow?.(reel.creator?._id)}
          className="rounded-full"
        >
          Follow
        </Button>
      </motion.div>

      {/* Actions - Right */}
      <motion.div
        className="absolute bottom-32 right-4 space-y-6 z-20"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
      >
        {/* Like */}
        <motion.button
          onClick={handleLike}
          className="flex flex-col items-center space-y-1"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <div className="bg-gray-800 bg-opacity-50 p-3 rounded-full hover:bg-opacity-75 transition-all">
            <FiHeart
              size={24}
              className={`${liked ? "fill-red-500 text-red-500" : "text-white"}`}
            />
          </div>
          <span className="text-white text-xs">{reel.likes?.length || 0}</span>
        </motion.button>

        {/* Comment */}
        <motion.button
          onClick={() => onComment?.(reel._id)}
          className="flex flex-col items-center space-y-1"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <div className="bg-gray-800 bg-opacity-50 p-3 rounded-full hover:bg-opacity-75 transition-all">
            <FiMessageCircle size={24} className="text-white" />
          </div>
          <span className="text-white text-xs">{reel.comments?.length || 0}</span>
        </motion.button>

        {/* Share */}
        <motion.button
          onClick={() => onShare?.(reel._id)}
          className="flex flex-col items-center space-y-1"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <div className="bg-gray-800 bg-opacity-50 p-3 rounded-full hover:bg-opacity-75 transition-all">
            <FiShare2 size={24} className="text-white" />
          </div>
          <span className="text-white text-xs">Share</span>
        </motion.button>

        {/* Save */}
        <motion.button
          onClick={() => setSaved(!saved)}
          className="flex flex-col items-center space-y-1"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <div className="bg-gray-800 bg-opacity-50 p-3 rounded-full hover:bg-opacity-75 transition-all">
            <FiBookmark
              size={24}
              className={`${saved ? "fill-current" : ""} text-white`}
            />
          </div>
          <span className="text-white text-xs">Save</span>
        </motion.button>
      </motion.div>

      {/* Caption - Bottom */}
      <motion.div
        className="absolute bottom-6 left-4 right-20 z-20"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <p className="text-white text-sm line-clamp-2">{reel.caption}</p>
      </motion.div>

      {/* Sound icon */}
      <motion.div
        className="absolute bottom-6 right-4 text-white"
        animate={{ rotate: [0, 10, -10, 0] }}
        transition={{ duration: 0.5, repeat: Infinity }}
      >
        🔊
      </motion.div>
    </motion.div>
  );
};

export const ReelsPage = ({
  reels = [],
  currentUser,
  onLike,
  onComment,
  onShare,
  onFollow,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const containerRef = useRef(null);

  const handleNext = () => {
    if (currentIndex < reels.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      // Load more reels or loop
      setCurrentIndex(0);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "ArrowUp") handlePrev();
      if (e.key === "ArrowDown") handleNext();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentIndex]);

  return (
    <motion.div
      ref={containerRef}
      className="relative w-full h-screen bg-black overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <AnimatePresence mode="wait">
        {reels.length > 0 && (
          <ReelPlayer
            key={currentIndex}
            reel={reels[currentIndex]}
            isActive={true}
            onLike={onLike}
            onComment={onComment}
            onShare={onShare}
            onFollow={onFollow}
          />
        )}
      </AnimatePresence>

      {/* Navigation hints */}
      <motion.div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white opacity-30 pointer-events-none"
        animate={{ y: [0, 10, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <div className="text-center">
          <p className="text-sm mb-2">↑ ↓</p>
          <p className="text-xs">Scroll for more</p>
        </div>
      </motion.div>

      {/* Progress indicator */}
      <div className="absolute top-4 left-4 text-white text-xs z-20">
        <span>{currentIndex + 1}</span>
        <span className="opacity-50"> / {reels.length}</span>
      </div>
    </motion.div>
  );
};

export default ReelsPage;
