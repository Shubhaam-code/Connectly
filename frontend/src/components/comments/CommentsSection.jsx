import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiHeart, FiCornerDownRight, FiCornerDownLeft, FiChevronDown, FiChevronUp } from "react-icons/fi";
import { useDispatch, useSelector } from "react-redux";
import axiosInstance from "../../lib/axiosInstance";
import { setPostData } from "../../redux/postSlice";
import { formatTime } from "../../utils/formatters";
import dp from "../../assets/dp.webp";

// HINGLISH: Custom CommentItem to render nested replies with likes and accordion toggles
const CommentItem = ({ comment, postId, currentUserId, onReplyClick, onLikeComment, onLikeReply }) => {
  const [showReplies, setShowReplies] = useState(false);
  const hasReplies = comment.replies && comment.replies.length > 0;
  
  const hasLikedComment = comment.likes?.some(id => id.toString() === currentUserId?.toString());

  return (
    <div className="space-y-3">
      {/* Top level comment */}
      <div className="flex items-start justify-between gap-3 group">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <img 
            src={comment.author?.profileImage || dp} 
            alt={comment.author?.userName} 
            className="w-8 h-8 rounded-full object-cover bg-[var(--hover)] flex-shrink-0"
          />
          <div className="text-xs flex-1">
            <span className="font-semibold text-[var(--text-primary)] mr-1.5 hover:underline cursor-pointer">
              {comment.author?.userName}
            </span>
            <span className="text-[var(--text-secondary)] break-words">{comment.message}</span>
            <div className="flex items-center gap-4 mt-1.5 text-[10px] text-[var(--text-muted)]">
              <span>{formatTime(comment.createdAt)}</span>
              {(comment.likes?.length || 0) > 0 && (
                <span className="font-semibold">{comment.likes.length} {comment.likes.length === 1 ? 'like' : 'likes'}</span>
              )}
              <button 
                onClick={() => onReplyClick(comment)}
                className="hover:text-[var(--text-primary)] font-semibold flex items-center gap-0.5"
              >
                <FiCornerDownLeft size={10} /> Reply
              </button>
            </div>
          </div>
        </div>

        {/* Comment Like Heart */}
        <button 
          onClick={() => onLikeComment(comment._id)} 
          className="text-[var(--text-muted)] hover:text-red-500 p-1 flex-shrink-0 transition-colors"
        >
          <FiHeart size={12} className={hasLikedComment ? "fill-red-500 text-red-500" : ""} />
        </button>
      </div>

      {/* Accordion toggle for nested replies */}
      {hasReplies && (
        <div className="pl-11">
          <button
            onClick={() => setShowReplies(!showReplies)}
            className="flex items-center gap-1.5 text-[10px] font-semibold text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
          >
            <span className="w-6 h-px bg-[var(--border)] inline-block mr-1"></span>
            {showReplies ? (
              <>Hide replies <FiChevronUp size={10} /></>
            ) : (
              <>View replies ({comment.replies.length}) <FiChevronDown size={10} /></>
            )}
          </button>
        </div>
      )}

      {/* Nested Replies List */}
      {hasReplies && showReplies && (
        <div className="pl-11 space-y-3.5 border-l border-[var(--border)] ml-4 mt-2">
          {comment.replies.map((reply) => {
            const hasLikedReply = reply.likes?.some(id => id.toString() === currentUserId?.toString());
            return (
              <div key={reply._id} className="flex items-start justify-between gap-3 group">
                <div className="flex items-start gap-2.5 flex-1 min-w-0">
                  <img 
                    src={reply.author?.profileImage || dp} 
                    alt={reply.author?.userName} 
                    className="w-6 h-6 rounded-full object-cover bg-[var(--hover)] flex-shrink-0"
                  />
                  <div className="text-xs flex-1">
                    <span className="font-semibold text-[var(--text-primary)] mr-1.5 hover:underline cursor-pointer">
                      {reply.author?.userName}
                    </span>
                    <span className="text-[var(--text-secondary)] break-words">{reply.message}</span>
                    <div className="flex items-center gap-4 mt-1.5 text-[10px] text-[var(--text-muted)]">
                      <span>{formatTime(reply.createdAt)}</span>
                      {(reply.likes?.length || 0) > 0 && (
                        <span className="font-semibold">{reply.likes.length} {reply.likes.length === 1 ? 'like' : 'likes'}</span>
                      )}
                      <button 
                        onClick={() => onReplyClick(comment, reply.author?.userName)}
                        className="hover:text-[var(--text-primary)] font-semibold"
                      >
                        Reply
                      </button>
                    </div>
                  </div>
                </div>

                {/* Reply Like Heart */}
                <button 
                  onClick={() => onLikeReply(comment._id, reply._id)} 
                  className="text-[var(--text-muted)] hover:text-red-500 p-1 flex-shrink-0 transition-colors"
                >
                  <FiHeart size={10} className={hasLikedReply ? "fill-red-500 text-red-500" : ""} />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export const CommentsSection = ({ postId, comments = [] }) => {
  const dispatch = useDispatch();
  const { userData, suggestedUsers } = useSelector((state) => state.user);
  const { postData } = useSelector((state) => state.post);

  const [inputVal, setInputVal] = useState("");
  const [replyingTo, setReplyingTo] = useState(null); // Parent comment object
  const [submitting, setSubmitting] = useState(false);

  // Mention system state
  const [showMentions, setShowMentions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState("");
  const [mentionIndex, setMentionIndex] = useState(0);
  const [filteredMentionUsers, setFilteredMentionUsers] = useState([]);

  const inputRef = useRef(null);

  // Sync suggestion users from Redux following list or suggested list
  const allUsersForMentions = [
    ...(userData?.following || []),
    ...(suggestedUsers || [])
  ].filter((u, idx, self) => 
    self.findIndex(t => t._id === u._id) === idx
  );

  // Check input text for "@" patterns to suggest users
  useEffect(() => {
    const parts = inputVal.split(/\s+/);
    const lastWord = parts[parts.length - 1];

    if (lastWord && lastWord.startsWith("@")) {
      const query = lastWord.slice(1).toLowerCase();
      setMentionQuery(query);

      const matched = allUsersForMentions.filter(u =>
        u.userName?.toLowerCase().includes(query) ||
        u.name?.toLowerCase().includes(query)
      );

      setFilteredMentionUsers(matched.slice(0, 5));
      setShowMentions(matched.length > 0);
      setMentionIndex(0);
    } else {
      setShowMentions(false);
    }
  }, [inputVal]);

  const handleMentionSelect = (username) => {
    const parts = inputVal.split(" ");
    parts[parts.length - 1] = `@${username} `;
    setInputVal(parts.join(" "));
    setShowMentions(false);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e) => {
    if (showMentions) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setMentionIndex((prev) => (prev + 1) % filteredMentionUsers.length);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setMentionIndex((prev) => (prev - 1 + filteredMentionUsers.length) % filteredMentionUsers.length);
      } else if (e.key === "Enter") {
        e.preventDefault();
        handleMentionSelect(filteredMentionUsers[mentionIndex].userName);
      } else if (e.key === "Escape") {
        setShowMentions(false);
      }
    }
  };

  // Trigger like comment
  const handleLikeComment = async (commentId) => {
    try {
      const result = await axiosInstance.get(`/api/post/comment/like/${postId}/${commentId}`);
      const updated = postData.map(p => p._id === postId ? result.data : p);
      dispatch(setPostData(updated));
    } catch (err) {
      console.error(err);
    }
  };

  // Trigger like reply
  const handleLikeReply = async (commentId, replyId) => {
    try {
      const result = await axiosInstance.get(`/api/post/comment/reply/like/${postId}/${commentId}/${replyId}`);
      const updated = postData.map(p => p._id === postId ? result.data : p);
      dispatch(setPostData(updated));
    } catch (err) {
      console.error(err);
    }
  };

  // Initiate reply mode
  const handleReplyClick = (comment, userNamePrefix = null) => {
    setReplyingTo(comment);
    const prefix = userNamePrefix ? `@${userNamePrefix} ` : `@${comment.author?.userName} `;
    setInputVal(prefix);
    inputRef.current?.focus();
  };

  // Submit comment / reply
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!inputVal.trim() || submitting) return;

    setSubmitting(true);
    try {
      const body = {
        message: inputVal,
      };
      if (replyingTo) {
        body.parentCommentId = replyingTo._id;
      }

      const result = await axiosInstance.post(`/api/post/comment/${postId}`, body);
      const updated = postData.map(p => p._id === postId ? result.data : p);
      dispatch(setPostData(updated));

      setInputVal("");
      setReplyingTo(null);
    } catch (err) {
      console.error("comment submit error:", err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[var(--card)] justify-between">
      
      {/* Scrollable list of comments */}
      <div className="flex-1 overflow-y-auto space-y-5 py-4 scrollbar-none">
        {comments && comments.length > 0 ? (
          comments.map((comment) => (
            <CommentItem
              key={comment._id}
              comment={comment}
              postId={postId}
              currentUserId={userData?._id}
              onReplyClick={handleReplyClick}
              onLikeComment={handleLikeComment}
              onLikeReply={handleLikeReply}
            />
          ))
        ) : (
          <div className="text-center py-8 text-xs text-[var(--text-muted)]">
            No comments yet. Start the conversation!
          </div>
        )}
      </div>

      {/* Input container */}
      <div className="border-t border-[var(--border)] pt-3 relative bg-[var(--card)]">
        
        {/* Mentions autocomplete popup overlay */}
        {showMentions && (
          <div className="absolute bottom-full left-0 right-0 bg-[var(--card)] border border-[var(--border)] rounded-lg shadow-2xl mb-2 overflow-hidden z-50">
            {filteredMentionUsers.map((user, idx) => (
              <div
                key={user._id}
                onClick={() => handleMentionSelect(user.userName)}
                className={`flex items-center gap-2 px-3 py-2 cursor-pointer text-xs transition-colors ${
                  idx === mentionIndex ? "bg-[var(--primary)]/10 text-[var(--primary)]" : "text-[var(--text-primary)] hover:bg-[var(--hover)]"
                }`}
              >
                <img src={user.profileImage || dp} alt="" className="w-5 h-5 rounded-full object-cover" />
                <div>
                  <p className="font-semibold">{user.userName}</p>
                  <p className="text-[10px] text-[var(--text-muted)]">{user.name}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Replying indicator */}
        {replyingTo && (
          <div className="flex items-center justify-between text-[10px] text-[var(--text-secondary)] bg-[var(--background-secondary)] px-3 py-1.5 rounded mb-2.5">
            <span>Replying to <span className="text-[var(--primary)] font-semibold">@{replyingTo.author?.userName}</span></span>
            <button 
              onClick={() => {
                setReplyingTo(null);
                setInputVal("");
              }} 
              className="text-[var(--danger)] hover:text-red-500 font-bold"
            >
              Cancel
            </button>
          </div>
        )}

        {/* Form input */}
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            placeholder={replyingTo ? "Write a reply..." : "Add a comment..."}
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-[var(--input-bg)] border border-[var(--input-border)] text-xs text-[var(--text-primary)] rounded-lg px-3 py-2.5 focus:outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] transition-colors"
          />
          <button 
            type="submit" 
            disabled={submitting || !inputVal.trim()}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg text-xs text-white font-semibold transition-colors flex-shrink-0"
          >
            Post
          </button>
        </form>
      </div>

    </div>
  );
};

export default CommentsSection;
