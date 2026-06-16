import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiChevronLeft, FiChevronRight, FiX, FiTrash2, FiEye } from "react-icons/fi";
import { useDispatch, useSelector } from "react-redux";
import { Avatar } from "../ui/UIComponents";
import { deleteStoryFromState, setStoryList } from "../../redux/storySlice";
import axiosInstance from "../../lib/axiosInstance";
import dp from "../../assets/dp.webp";

// Story progress bar component
const StoryProgressBar = ({ duration, isPaused, onComplete }) => {
  const [progress, setProgress] = useState(0);
  const requestRef = useRef();
  const startTimeRef = useRef();

  const animate = useCallback((time) => {
    if (!startTimeRef.current) startTimeRef.current = time;
    const elapsed = time - startTimeRef.current;
    const nextProgress = Math.min((elapsed / duration) * 100, 100);

    setProgress(nextProgress);

    if (nextProgress < 100) {
      if (!isPaused) {
        requestRef.current = requestAnimationFrame(animate);
      }
    } else {
      onComplete();
    }
  }, [duration, isPaused, onComplete]);

  useEffect(() => {
    if (!isPaused) {
      requestRef.current = requestAnimationFrame(animate);
    }
    return () => cancelAnimationFrame(requestRef.current);
  }, [isPaused, animate]);

  return (
    <div className="h-1 bg-white/30 rounded-full overflow-hidden w-full">
      <div
        className="h-full bg-white transition-all duration-100 ease-linear"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
};

export const StoryViewer = ({ groupedStories, initialUserIndex, onClose }) => {
  const { userData } = useSelector((state) => state.user);
  const dispatch = useDispatch();

  const [currentUserIndex, setCurrentUserIndex] = useState(initialUserIndex);
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [showViewersList, setShowViewersList] = useState(false);
  const [replyText, setReplyText] = useState("");

  const handleSendReaction = async (emoji) => {
    try {
      await axiosInstance.post(`/api/message/send/${activeGroup?._id}`, {
        message: `Reacted to your story: ${emoji}`,
        sharedStory: currentStory?._id
      })
      alert(`Sent reaction: ${emoji}`)
    } catch (err) {
      console.error("Failed to send reaction:", err)
    }
  }

  const handleSendReply = async () => {
    if (!replyText.trim()) return
    const textToSend = replyText
    setReplyText("")
    setIsPaused(false)
    try {
      await axiosInstance.post(`/api/message/send/${activeGroup?._id}`, {
        message: textToSend,
        sharedStory: currentStory?._id
      })
      alert("Message sent!")
    } catch (err) {
      console.error("Failed to send reply:", err)
    }
  }

  const activeGroup = groupedStories[currentUserIndex];
  const currentStories = activeGroup?.stories || [];
  const currentStory = currentStories[currentStoryIndex];
  const isOwnStory = activeGroup?._id === userData?._id;

  const handleNext = useCallback(() => {
    if (currentStoryIndex < currentStories.length - 1) {
      setCurrentStoryIndex((prev) => prev + 1);
    } else if (currentUserIndex < groupedStories.length - 1) {
      setCurrentUserIndex((prev) => prev + 1);
      setCurrentStoryIndex(0);
    } else {
      onClose();
    }
  }, [currentStoryIndex, currentStories.length, currentUserIndex, groupedStories.length, onClose]);

  const handlePrev = useCallback(() => {
    if (currentStoryIndex > 0) {
      setCurrentStoryIndex((prev) => prev - 1);
    } else if (currentUserIndex > 0) {
      setCurrentUserIndex((prev) => prev - 1);
      setCurrentStoryIndex(groupedStories[currentUserIndex - 1].stories.length - 1);
    }
  }, [currentStoryIndex, currentUserIndex, groupedStories]);

  // Mark story as viewed
  useEffect(() => {
    if (currentStory && userData) {
      const alreadyViewed = currentStory.viewers?.some(
        (v) => (v._id || v).toString() === userData._id.toString()
      );
      if (!alreadyViewed) {
        axiosInstance.get(`/api/story/view/${currentStory._id}`).catch((err) => {
          console.error("Error viewing story:", err);
        });
      }
    }
  }, [currentStory, userData]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "ArrowRight") handleNext();
      if (e.key === "ArrowLeft") handlePrev();
      if (e.key === "Escape") onClose();
      if (e.key === " ") setIsPaused((prev) => !prev);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleNext, handlePrev, onClose]);

  // Delete story function
  const handleDelete = async () => {
    if (!currentStory) return;
    try {
      await axiosInstance.delete(`/api/story/${currentStory._id}`);
      dispatch(deleteStoryFromState(currentStory._id));

      // Update local array
      const updatedStories = currentStories.filter((s) => s._id !== currentStory._id);
      if (updatedStories.length === 0) {
        // No stories left in this group, close viewer or move to next
        if (groupedStories.length === 1) {
          onClose();
        } else {
          handleNext();
        }
      } else {
        // Keep index correct
        setCurrentStoryIndex((prev) => Math.min(prev, updatedStories.length - 1));
      }
    } catch (err) {
      console.error("Failed to delete story:", err);
    }
  };

  if (!currentStory) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/95 z-[999] flex items-center justify-center"
      onClick={onClose}
    >
      {/* Viewer Container */}
      <div
        className="relative w-full max-w-[480px] h-[90vh] md:h-[800px] bg-black rounded-xl overflow-hidden flex flex-col justify-center select-none"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Progress bar stack */}
        <div className="absolute top-3 left-3 right-3 flex gap-1.5 z-50">
          {currentStories.map((_, idx) => (
            <div key={idx} className="flex-1">
              {idx === currentStoryIndex ? (
                <StoryProgressBar
                  duration={5000}
                  isPaused={isPaused}
                  onComplete={handleNext}
                />
              ) : (
                <div
                  className={`h-1 rounded-full ${idx < currentStoryIndex ? "bg-white" : "bg-white/20"}`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Top Header info */}
        <div className="absolute top-7 left-4 right-4 flex items-center justify-between z-50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full overflow-hidden border border-white/20">
              <img
                src={activeGroup.avatar || dp}
                alt={activeGroup.username}
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <span className="text-white text-sm font-semibold">{activeGroup.username}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 text-white">
            {isOwnStory && (
              <button
                onClick={handleDelete}
                className="p-2 hover:bg-white/10 rounded-full transition-colors"
                title="Delete story"
              >
                <FiTrash2 size={18} />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-full transition-colors"
            >
              <FiX size={20} />
            </button>
          </div>
        </div>

        {/* Media Content Display */}
        <div
          className="w-full h-full flex items-center justify-center bg-black relative"
          onPointerDown={() => setIsPaused(true)}
          onPointerUp={() => setIsPaused(false)}
        >
          {currentStory.mediaType === "video" ? (
            <video
              src={currentStory.media}
              className="max-h-full max-w-full object-contain"
              autoPlay
              controls={false}
              muted={false}
            />
          ) : (
            <img
              src={currentStory.media}
              alt="story"
              className="max-h-full max-w-full object-contain pointer-events-none"
            />
          )}
        </div>

        {/* Viewers display at bottom (Own story only) */}
        {isOwnStory && (
          <div className="absolute bottom-4 left-4 right-4 z-50 flex justify-center">
            <button
              onClick={() => setShowViewersList(true)}
              className="bg-black/50 backdrop-blur px-4 py-2 rounded-full text-white text-xs font-semibold flex items-center gap-2 border border-white/10"
            >
              <FiEye size={14} />
              <span>{currentStory.viewers?.length || 0} views</span>
            </button>
          </div>
        )}

        {/* Reply/Reaction bar for other users' stories */}
        {!isOwnStory && (
          <div className="absolute bottom-4 left-4 right-4 z-50 flex flex-col gap-2">
            {/* Quick Reactions Emojis Row */}
            <div className="flex items-center justify-around bg-black/40 backdrop-blur-md py-1.5 px-3 rounded-full border border-white/5 mx-6">
              {["😂", "😮", "❤️", "😢", "👏", "🔥"].map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => handleSendReaction(emoji)}
                  className="text-xl hover:scale-125 transition-transform cursor-pointer"
                >
                  {emoji}
                </button>
              ))}
            </div>

            {/* Input message box */}
            <div className="flex items-center gap-2 bg-black/40 backdrop-blur-md px-4 py-2.5 rounded-full border border-white/10">
              <input
                type="text"
                placeholder="Send message..."
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                onFocus={() => setIsPaused(true)}
                onBlur={() => setIsPaused(false)}
                onKeyDown={(e) => e.key === "Enter" && handleSendReply()}
                className="flex-1 bg-transparent text-xs text-white outline-none placeholder:text-gray-500"
              />
              {replyText.trim() && (
                <button
                  onClick={handleSendReply}
                  className="text-xs font-bold text-purple-400 hover:text-purple-300 transition-colors"
                >
                  Send
                </button>
              )}
            </div>
          </div>
        )}

        {/* Left/Right swipe/tap navigations */}
        <div
          className="absolute left-0 top-0 bottom-0 w-1/4 cursor-pointer"
          onClick={handlePrev}
        />
        <div
          className="absolute right-0 top-0 bottom-0 w-1/4 cursor-pointer"
          onClick={handleNext}
        />
      </div>

      {/* Desktop Chevron controls */}
      {currentUserIndex > 0 && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            handlePrev();
          }}
          className="hidden md:flex fixed left-10 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors z-[1000]"
        >
          <FiChevronLeft size={28} />
        </button>
      )}

      {(currentUserIndex < groupedStories.length - 1 || currentStoryIndex < currentStories.length - 1) && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleNext();
          }}
          className="hidden md:flex fixed right-10 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors z-[1000]"
        >
          <FiChevronRight size={28} />
        </button>
      )}

      {/* Viewers slide up panel */}
      <AnimatePresence>
        {showViewersList && (
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            className="fixed inset-x-0 bottom-0 max-w-[480px] mx-auto bg-[var(--card)] border-t border-[var(--border)] rounded-t-2xl z-[1000] p-4 h-[400px] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center pb-3 border-b border-[var(--border)] mb-3">
              <span className="text-[var(--text-primary)] text-sm font-semibold flex items-center gap-2">
                <FiEye size={16} />
                Viewers ({currentStory.viewers?.length || 0})
              </span>
              <button
                onClick={() => setShowViewersList(false)}
                className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer"
              >
                <FiX size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3">
              {currentStory.viewers?.map((viewer, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <Avatar src={viewer.profileImage || dp} size="sm" />
                  <div>
                    <p className="text-[var(--text-primary)] text-xs font-semibold">{viewer.userName}</p>
                    <p className="text-[var(--text-secondary)] text-[10px]">{viewer.name}</p>
                  </div>
                </div>
              ))}
              {(!currentStory.viewers || currentStory.viewers.length === 0) && (
                <div className="text-center py-10 text-xs text-[var(--text-muted)]">
                  No views yet
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export const StoryBubble = ({ group, onClick, isOwn }) => {
  const hasStories = group?.stories?.length > 0;

  // Calculate if there are unseen stories
  // A story is unseen if the user's ID is not in its viewers array
  const { userData } = useSelector((state) => state.user);
  const hasUnseen = hasStories && group.stories.some(
    (s) => !s.viewers?.some((v) => (v._id || v).toString() === userData?._id?.toString())
  );

  // Background media
  const backgroundMedia = hasStories 
    ? group.stories[0]?.media 
    : (group.avatar || dp);

  return (
    <motion.div
      onClick={onClick}
      className="w-24 h-36 md:w-28 md:h-44 rounded-2xl overflow-hidden relative flex flex-col justify-between p-3 flex-shrink-0 cursor-pointer border border-[var(--border)] shadow-lg group"
      whileHover={{ scale: 1.03, translateY: -2 }}
      whileTap={{ scale: 0.98 }}
      style={{
        background: `linear-gradient(180deg, rgba(0, 0, 0, 0.2) 0%, rgba(0, 0, 0, 0.8) 100%), url(${backgroundMedia})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }}
    >
      {/* Top: Avatar with Ring */}
      <div className="z-10 flex justify-start w-full">
        {isOwn && !hasStories ? (
          <div className="w-0 h-0" />
        ) : (
          <div
            className={`w-9 h-9 rounded-full p-[1.5px] flex items-center justify-center ${
              hasStories
                ? hasUnseen
                  ? "bg-gradient-to-tr from-[#8B5CF6] via-[#EC4899] to-[#A855F7] animate-pulse"
                  : "border border-white/20"
                : ""
            }`}
          >
            <div className="w-full h-full rounded-full bg-black overflow-hidden flex items-center justify-center p-[1px]">
              <img
                src={group.avatar || dp}
                alt=""
                className="w-full h-full object-cover rounded-full"
              />
            </div>
          </div>
        )}
      </div>

      {/* Middle/Center: Plus icon for empty own story */}
      {isOwn && !hasStories && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 z-10 p-2">
          <div className="relative">
            <div className="w-10 h-10 rounded-full overflow-hidden border border-[var(--border)]">
              <Avatar src={userData?.profileImage || dp} alt="" size="w-full h-full" className="w-full h-full hover:scale-100" />
            </div>
            <div className="absolute bottom-[-4px] right-[-4px] bg-[#8B5CF6] border border-[var(--background)] rounded-full w-5 h-5 flex items-center justify-center text-white text-xs font-bold shadow-[0_0_8px_rgba(139,92,246,0.6)]">
              +
            </div>
          </div>
        </div>
      )}

      {/* Bottom: Username */}
      <span className="text-[10px] md:text-xs font-bold text-white max-w-full truncate z-10 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] text-left select-none">
        {isOwn ? "Your Story" : group.username}
      </span>
    </motion.div>
  );
};

export const StoriesContainer = ({ stories = [], ownStories = [], onStoryClick, onAddOwnClick }) => {
  const { userData } = useSelector((state) => state.user);
  const [groupedList, setGroupedList] = useState([]);

  // Merge & group stories
  useEffect(() => {
    // 1. Group followed users' stories by author._id
    const groupedFollowed = stories.reduce((acc, story) => {
      if (!story.author) return acc;
      const authorId = story.author._id;
      
      // Skip if this is the current user's story to avoid duplicate
      if (userData?._id && authorId.toString() === userData._id.toString()) {
        return acc;
      }

      const existing = acc.find((g) => g._id === authorId);

      if (existing) {
        existing.stories.push(story);
      } else {
        acc.push({
          _id: authorId,
          username: story.author.userName,
          avatar: story.author.profileImage,
          stories: [story],
        });
      }
      return acc;
    }, []);

    // 2. Format own stories group
    const ownGroup = {
      _id: userData?._id,
      username: "Your Story",
      avatar: userData?.profileImage,
      stories: ownStories || [],
      isOwn: true,
    };

    // 3. Assemble full list: own stories first, followed users next
    setGroupedList([ownGroup, ...groupedFollowed]);
  }, [stories, ownStories, userData]);

  const handleBubbleClick = (index, group) => {
    if (group.isOwn && group.stories.length === 0) {
      onAddOwnClick?.();
    } else {
      onStoryClick?.(index, groupedList);
    }
  };

  return (
    <div className="flex gap-3 overflow-x-auto py-4 px-4 scrollbar-none border-b border-[var(--border)] bg-[var(--background)] w-full">
      {groupedList.map((group, idx) => (
        <StoryBubble
          key={group._id || idx}
          group={group}
          isOwn={group.isOwn}
          onClick={() => handleBubbleClick(idx, group)}
        />
      ))}
    </div>
  );
};

export default StoryViewer;
