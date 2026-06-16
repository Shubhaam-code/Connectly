import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiX, FiSearch, FiCheck } from "react-icons/fi";
import { useSelector } from "react-redux";
import axiosInstance from "../../lib/axiosInstance";
import dp from "../../assets/dp.webp";

// HINGLISH: Premium dark-themed Share Modal that lets you share posts/reels/stories with friends
export const ShareModal = ({
  isOpen,
  onClose,
  item,
  itemType, // 'post' | 'loop' | 'story'
}) => {
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [sharing, setSharing] = useState(false);

  const { userData } = useSelector((state) => state.user);
  const { prevChatUsers } = useSelector((state) => state.message);

  // Group and filter candidates to share with
  const candidates = useMemo(() => {
    const list = [
      ...(prevChatUsers || []),
      ...(userData?.following || []),
    ];
    // Remove duplicates and current user
    return list.filter(
      (user, idx, self) =>
        user?._id !== userData?._id &&
        self.findIndex((u) => u?._id === user?._id) === idx
    );
  }, [prevChatUsers, userData]);

  const filteredCandidates = useMemo(() => {
    if (!searchQuery) return candidates;
    return candidates.filter(
      (user) =>
        user.userName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.name?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery, candidates]);

  const handleToggleUser = (userId) => {
    setSelectedUsers((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const handleShare = async () => {
    if (selectedUsers.length === 0 || sharing) return;
    setSharing(true);
    try {
      for (const userId of selectedUsers) {
        const body = {
          message: `Shared a ${itemType}`,
        };
        if (itemType === "post") {
          body.sharedPost = item._id;
        } else if (itemType === "loop") {
          body.sharedLoop = item._id;
        } else if (itemType === "story") {
          body.sharedStory = item._id;
        }

        await axiosInstance.post(`/api/message/send/${userId}`, body);
      }
      setSelectedUsers([]);
      setSearchQuery("");
      onClose?.();
    } catch (err) {
      console.error("Failed to share:", err);
    } finally {
      setSharing(false);
    }
  };

  if (!isOpen || !item) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/80 z-[999] flex items-center justify-center p-4">
        {/* Backdrop close click */}
        <div className="absolute inset-0" onClick={onClose}></div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-[var(--card)] border border-[var(--border)] rounded-2xl w-full max-w-md overflow-hidden flex flex-col z-10 max-h-[85vh] shadow-2xl text-white"
        >
          {/* Header */}
          <div className="p-4 border-b border-[var(--border)] flex items-center justify-between">
            <h2 className="text-base font-semibold">Share</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-white p-1 transition-colors">
              <FiX size={18} />
            </button>
          </div>

          {/* Search bar */}
          <div className="p-3 border-b border-[var(--border)]">
            <div className="flex items-center gap-2.5 px-3.5 h-9 bg-[#1c1c1c] border border-[var(--border)] rounded-xl text-gray-500">
              <FiSearch size={16} />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-xs text-white bg-transparent outline-none placeholder:text-neutral-600"
              />
            </div>
          </div>

          {/* Candidates list */}
          <div className="flex-1 overflow-y-auto p-2 min-h-[250px] space-y-1">
            {filteredCandidates.length > 0 ? (
              filteredCandidates.map((user) => {
                const isSelected = selectedUsers.includes(user._id);
                return (
                  <button
                    key={user._id}
                    onClick={() => handleToggleUser(user._id)}
                    className="w-full flex items-center gap-3 p-2.5 hover:bg-[var(--hover)] rounded-xl transition-all"
                  >
                    <img
                      src={user.profileImage || dp}
                      alt=""
                      className="w-9 h-9 rounded-full object-cover bg-neutral-900"
                    />
                    <div className="flex-1 text-left min-w-0">
                      <p className="text-xs font-semibold text-white truncate">{user.userName}</p>
                      <p className="text-[10px] text-neutral-500 truncate">{user.name}</p>
                    </div>

                    {/* Selection circle */}
                    <div
                      className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${
                        isSelected
                          ? "bg-purple-600 border-purple-600 text-white"
                          : "border-[#3c3c3c] text-transparent hover:border-gray-400"
                      }`}
                    >
                      <FiCheck size={12} strokeWidth={3} />
                    </div>
                  </button>
                );
              })
            ) : (
              <div className="text-center py-12 text-xs text-neutral-500">
                No users found to share with.
              </div>
            )}
          </div>

          {/* Footer Action buttons */}
          <div className="p-4 border-t border-[var(--border)] bg-[#161616] flex items-center justify-between gap-3">
            <span className="text-xs text-neutral-400">
              {selectedUsers.length > 0 ? `${selectedUsers.length} selected` : "Select friends"}
            </span>

            <div className="flex gap-2">
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-lg text-xs font-semibold text-neutral-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleShare}
                disabled={selectedUsers.length === 0 || sharing}
                className="px-6 py-2 rounded-lg text-xs font-semibold bg-purple-600 hover:bg-purple-700 disabled:bg-neutral-800 disabled:text-neutral-600 transition-all text-white"
              >
                {sharing ? "Sending..." : "Send"}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default ShareModal;
