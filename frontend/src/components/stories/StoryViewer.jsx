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
            className="fixed inset-x-0 bottom-0 max-w-[480px] mx-auto bg-[#121212] border-t border-[#262626] rounded-t-2xl z-[1000] p-4 h-[400px] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center pb-3 border-b border-[#262626] mb-3">
              <span className="text-white text-sm font-semibold flex items-center gap-2">
                <FiEye size={16} />
                Viewers ({currentStory.viewers?.length || 0})
              </span>
              <button
                onClick={() => setShowViewersList(false)}
                className="text-[#A8A8A8] hover:text-white"
              >
                <FiX size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3">
              {currentStory.viewers?.map((viewer, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <Avatar src={viewer.profileImage || dp} size="sm" />
                  <div>
                    <p className="text-white text-xs font-semibold">{viewer.userName}</p>
                    <p className="text-[#A8A8A8] text-[10px]">{viewer.name}</p>
                  </div>
                </div>
              ))}
              {(!currentStory.viewers || currentStory.viewers.length === 0) && (
                <div className="text-center py-10 text-xs text-[#A8A8A8]">
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

  return (
    <motion.div
      onClick={onClick}
      className="flex flex-col items-center gap-1.5 cursor-pointer flex-shrink-0"
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      {/* Outer ring */}
      <div
        className={`w-16 h-16 rounded-full p-[2px] flex items-center justify-center relative ${hasStories
            ? hasUnseen
              ? "bg-gradient-to-tr from-yellow-500 via-pink-500 to-purple-600"
              : "border border-[#262626]"
            : ""
          }`}
      >
        <div className="w-full h-full rounded-full bg-black p-[2.5px] overflow-hidden flex items-center justify-center">
          <img
            src={group.avatar || dp}
            alt={group.username}
            className="w-full h-full object-cover rounded-full"
          />
        </div>

        {/* Plus badge on empty own story bubble */}
        {!hasStories && isOwn && (
          <div className="absolute bottom-0 right-0 bg-blue-500 border-2 border-black rounded-full w-5 h-5 flex items-center justify-center text-white text-xs font-bold">
            +
          </div>
        )}
      </div>

      <span className="text-xs text-white max-w-[72px] truncate">
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
    <div className="flex gap-4 overflow-x-auto py-3 px-4 scrollbar-none border-b border-[#262626]">
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
