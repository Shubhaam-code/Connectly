import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiHeart,
  FiMessageCircle,
  FiShare2,
  FiBookmark,
  FiChevronLeft,
  FiChevronRight,
  FiX,
} from "react-icons/fi";
import { Avatar, Button } from "../ui/UIComponents";
import { formatTime } from "../../utils/formatters";
import dp from "../../assets/dp.webp";
import axiosInstance from "../../lib/axiosInstance";
import { useDispatch, useSelector } from "react-redux";
import { setPostData } from "../../redux/postSlice";
import CommentsSection from "../comments/CommentsSection";
import ShareModal from "../share/ShareModal";

export const PostModal = ({
  isOpen,
  onClose,
  post,
  onPrevious,
  onNext,
  canNavigatePrev,
  canNavigateNext,
  onLikeToggle,
  onCommentAdded
}) => {
  const { userData } = useSelector((state) => state.user);
  const [liked, setLiked] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);

  useEffect(() => {
    if (post && userData) {
      setLiked(post.likes?.some((id) => id.toString() === userData._id.toString()));
    }
  }, [post, userData]);

  if (!isOpen || !post) return null;

  const handleLike = async () => {
    try {
      setLiked(!liked);
      await axiosInstance.get(`/api/post/like/${post._id}`);
      onLikeToggle?.(post._id);
    } catch (err) {
      console.error(err);
      setLiked(liked); // Revert on fail
    }
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    setSubmitting(true);
    try {
      const res = await axiosInstance.post(`/api/post/comment/${post._id}`, {
        message: commentText,
      });
      setCommentText("");
      onCommentAdded?.(post._id, res.data.comments);
    } catch (err) {
      console.error("Failed to comment:", err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 bg-black/80 z-[999] flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="bg-[var(--card)] border border-[var(--border)] rounded-xl max-h-[90vh] md:h-[650px] overflow-hidden flex flex-col md:flex-row w-full max-w-4xl"
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Left Side - Post Media */}
          <div className="flex-1 bg-black flex items-center justify-center relative group min-h-[300px] md:min-h-0">
            {canNavigatePrev && (
              <motion.button
                onClick={onPrevious}
                className="absolute left-4 p-2 bg-black/60 text-white rounded-full hover:bg-black/80 transition-all z-10"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <FiChevronLeft size={24} />
              </motion.button>
            )}

            {post.mediaType === "video" ? (
              <video
                src={post.media}
                className="max-w-full max-h-full object-contain"
                controls
                autoPlay
              />
            ) : (
              <img
                src={post.media}
                alt="post"
                className="max-w-full max-h-full object-contain pointer-events-none"
              />
            )}

            {canNavigateNext && (
              <motion.button
                onClick={onNext}
                className="absolute right-4 p-2 bg-black/60 text-white rounded-full hover:bg-black/80 transition-all z-10"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <FiChevronRight size={24} />
              </motion.button>
            )}
          </div>

          {/* Right Side - Post Details */}
          <div className="w-full md:w-[360px] flex flex-col border-t md:border-t-0 md:border-l border-[var(--border)] max-h-[400px] md:max-h-full overflow-hidden bg-[var(--card)]">
            {/* Header */}
            <div className="p-4 border-b border-[var(--border)] flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Avatar src={post.author?.profileImage || dp} alt={post.author?.userName} size="md" />
                <div>
                  <p className="font-semibold text-[var(--text-primary)] text-sm">{post.author?.userName}</p>
                  <p className="text-xs text-[var(--text-muted)]">{post.author?.profession || "CONNECTLY creator"}</p>
                </div>
              </div>
              <motion.button
                onClick={onClose}
                className="text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                whileHover={{ scale: 1.1 }}
              >
                <FiX size={20} />
              </motion.button>
            </div>

            {/* Comments Area */}
            <div className="flex-1 flex flex-col p-4 overflow-hidden bg-[var(--card)]">
              {/* Caption */}
              <div className="flex items-start space-x-3 border-b border-[var(--border)] pb-3 flex-shrink-0">
                <Avatar src={post.author?.profileImage || dp} alt={post.author?.userName} size="sm" />
                <div className="flex-1">
                  <p className="text-xs text-[var(--text-primary)]">
                    <span className="font-semibold mr-1.5">{post.author?.userName}</span>
                    <span className="text-[var(--text-secondary)]">{post.caption}</span>
                  </p>
                  <span className="text-[10px] text-[var(--text-muted)] block mt-1">{formatTime(post.createdAt)}</span>
                </div>
              </div>

              {/* Nested Comments Component */}
              <div className="flex-1 overflow-hidden mt-3">
                <CommentsSection postId={post._id} comments={post.comments} />
              </div>
            </div>

            {/* Actions & Likes */}
            <div className="border-t border-[var(--border)] p-4 space-y-3 bg-[var(--card)] flex-shrink-0">
              <div className="flex items-center justify-between text-[var(--text-primary)]">
                <div className="flex items-center space-x-4">
                  <motion.button onClick={handleLike} whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }}>
                    <FiHeart size={22} className={liked ? "fill-red-500 text-red-500" : ""} />
                  </motion.button>
                  <motion.button whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }}>
                    <FiMessageCircle size={22} />
                  </motion.button>
                  <motion.button onClick={() => setIsShareOpen(true)} whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }}>
                    <FiShare2 size={22} />
                  </motion.button>
                </div>
                <motion.button whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }}>
                  <FiBookmark size={22} />
                </motion.button>
              </div>
 
              <div className="text-xs text-[var(--text-primary)] font-semibold">
                {post.likes?.length || 0} likes
              </div>
            </div>
          </div>
          {isShareOpen && (
            <ShareModal
              isOpen={isShareOpen}
              onClose={() => setIsShareOpen(false)}
              item={post}
              itemType="post"
            />
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export const PostCard = ({ post, onClick }) => {
  return (
    <motion.div
      onClick={onClick}
      className="aspect-square bg-[var(--background-secondary)] border border-[var(--border)] cursor-pointer overflow-hidden relative group rounded-lg"
      whileHover={{ scale: 1.02 }}
    >
      {post.mediaType === "video" ? (
        <video src={post.media} className="w-full h-full object-cover" muted />
      ) : (
        <img src={post.media} alt="post" className="w-full h-full object-cover" />
      )}

      {/* Hover Overlay */}
      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-6 text-white font-bold">
        <span className="flex items-center gap-1.5">
          <FiHeart className="fill-white" size={18} />
          {post.likes?.length || 0}
        </span>
        <span className="flex items-center gap-1.5">
          <FiMessageCircle size={18} />
          {post.comments?.length || 0}
        </span>
      </div>
    </motion.div>
  );
};

export default PostModal;
