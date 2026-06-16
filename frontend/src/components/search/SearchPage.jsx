import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiSearch, FiX, FiClock, FiTrendingUp } from "react-icons/fi";
import { Avatar, Input } from "../ui/UIComponents";
import { useDebounce } from "../../hooks/useCustom";

export const SearchResult = ({
  result,
  type, // 'user' | 'post' | 'reel' | 'hashtag'
  onClick,
}) => {
  const isUser = type === "user";
  const isHashtag = type === "hashtag";
  const isPost = type === "post";
  const isReel = type === "reel";

  if (isUser) {
    return (
      <motion.button
        onClick={onClick}
        className="w-full p-3 flex items-center space-x-3 hover:bg-gray-50 transition-colors border-b"
        whileHover={{ x: 5 }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <Avatar src={result.profilePic} alt={result.username} size="lg" />
        <div className="flex-1 text-left">
          <p className="font-semibold">{result.username}</p>
          <p className="text-sm text-gray-500">{result.name}</p>
          {result.isVerified && (
            <p className="text-xs text-blue-600">✓ Verified</p>
          )}
        </div>
        <p className="text-sm text-gray-500">{result.followers} followers</p>
      </motion.button>
    );
  }

  if (isHashtag) {
    return (
      <motion.button
        onClick={onClick}
        className="w-full p-3 flex items-center space-x-4 hover:bg-gray-50 transition-colors border-b"
        whileHover={{ x: 5 }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">
          #
        </div>
        <div className="flex-1 text-left">
          <p className="font-semibold text-blue-600">#{result.tag}</p>
          <p className="text-sm text-gray-500">{result.postCount} posts</p>
        </div>
        <motion.button
          onClick={(e) => {
            e.stopPropagation();
            // Follow hashtag
          }}
          className="text-blue-600 hover:text-blue-700 font-semibold text-sm"
          whileHover={{ scale: 1.05 }}
        >
          Follow
        </motion.button>
      </motion.button>
    );
  }

  if (isPost || isReel) {
    return (
      <motion.button
        onClick={onClick}
        className="aspect-square bg-gray-100 overflow-hidden rounded-lg relative group"
        whileHover={{ scale: 1.02 }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        {result.thumbnail ? (
          <img
            src={result.thumbnail}
            alt="post"
            className="w-full h-full object-cover group-hover:opacity-75 transition-opacity"
          />
        ) : (
          <video
            src={result.video}
            className="w-full h-full object-cover group-hover:opacity-75 transition-opacity"
          />
        )}

        {/* Hover overlay */}
        <motion.div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
          <div className="flex space-x-4 text-white">
            {isReel && <span className="text-lg">▶️</span>}
            {!isReel && (
              <>
                <div className="text-center">
                  <p className="text-lg">❤️</p>
                  <p className="text-xs">{result.likes || 0}</p>
                </div>
                <div className="text-center">
                  <p className="text-lg">💬</p>
                  <p className="text-xs">{result.comments || 0}</p>
                </div>
              </>
            )}
          </div>
        </motion.div>
      </motion.button>
    );
  }

  return null;
};

export const RecentSearches = ({ searches = [], onSelect, onDelete }) => {
  return (
    <motion.div
      className="space-y-3"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <div className="flex items-center justify-between px-4 py-2">
        <h3 className="font-semibold text-gray-800">Recent</h3>
        {searches.length > 0 && (
          <button className="text-blue-600 text-sm hover:text-blue-700">
            Clear All
          </button>
        )}
      </div>

      <div className="space-y-1">
        <AnimatePresence>
          {searches.map((search) => (
            <motion.button
              key={search.id}
              onClick={() => onSelect?.(search)}
              className="w-full p-3 flex items-center justify-between hover:bg-gray-50 transition-colors text-left"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              whileHover={{ x: 5 }}
            >
              <div className="flex items-center space-x-3">
                <FiClock size={16} className="text-gray-400" />
                <span className="text-gray-800">{search.query}</span>
              </div>
              <motion.button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete?.(search.id);
                }}
                className="text-gray-400 hover:text-gray-600"
                whileHover={{ scale: 1.1 }}
              >
                <FiX size={16} />
              </motion.button>
            </motion.button>
          ))}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export const TrendingSearches = ({ trending = [] }) => {
  return (
    <motion.div
      className="space-y-3"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <h3 className="font-semibold text-gray-800 px-4 py-2">Trending</h3>

      <div className="space-y-1">
        {trending.map((trend, idx) => (
          <motion.button
            key={idx}
            className="w-full p-3 flex items-center space-x-3 hover:bg-gray-50 transition-colors text-left"
            whileHover={{ x: 5 }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: idx * 0.05 }}
          >
            <FiTrendingUp size={16} className="text-blue-600" />
            <div className="flex-1">
              <p className="font-semibold text-gray-800">#{trend.tag}</p>
              <p className="text-xs text-gray-500">{trend.count} posts</p>
            </div>
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
};

export const SearchPage = ({
  onUserSelect,
  onPostSelect,
  onHashtagSelect,
  recentSearches = [],
  trendingSearches = [],
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState(null);
  const [searchType, setSearchType] = useState("all"); // 'all' | 'users' | 'posts' | 'hashtags'
  const debouncedQuery = useDebounce(searchQuery, 300);

  useEffect(() => {
    if (debouncedQuery) {
      // Perform search API call
      // This is where you'd call your search endpoint
      // setSearchResults(results);
    }
  }, [debouncedQuery]);

  const tabs = [
    { label: "All", value: "all" },
    { label: "Users", value: "users" },
    { label: "Posts", value: "posts" },
    { label: "Hashtags", value: "hashtags" },
    { label: "Reels", value: "reels" },
  ];

  return (
    <motion.div
      className="max-w-2xl mx-auto bg-white min-h-screen"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      {/* Search header */}
      <div className="sticky top-0 bg-white border-b z-20 p-4">
        <div className="relative">
          <FiSearch className="absolute left-4 top-3 text-gray-400 z-10" size={20} />
          <Input
            placeholder="Search users, posts, hashtags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 py-3 text-base"
          />
          {searchQuery && (
            <motion.button
              onClick={() => setSearchQuery("")}
              className="absolute right-4 top-3 text-gray-400 hover:text-gray-600"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <FiX size={20} />
            </motion.button>
          )}
        </div>
      </div>

      {/* Search results or suggestions */}
      <div className="divide-y">
        {searchQuery ? (
          <>
            {/* Tabs */}
            <div className="flex overflow-x-auto border-b px-4 bg-white sticky top-16 z-10">
              {tabs.map((tab) => (
                <motion.button
                  key={tab.value}
                  onClick={() => setSearchType(tab.value)}
                  className={`px-4 py-3 font-semibold text-sm whitespace-nowrap transition-colors ${
                    searchType === tab.value
                      ? "text-gray-800 border-b-2 border-gray-800"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                  whileHover={{ scale: 1.05 }}
                >
                  {tab.label}
                </motion.button>
              ))}
            </div>

            {/* Results grid or list */}
            {searchResults ? (
              searchType === "posts" || searchType === "reels" ? (
                <div className="grid grid-cols-3 gap-1 p-4">
                  {searchResults.map((result) => (
                    <SearchResult
                      key={result.id}
                      result={result}
                      type={searchType === "reels" ? "reel" : "post"}
                      onClick={() => onPostSelect?.(result)}
                    />
                  ))}
                </div>
              ) : (
                <div className="divide-y">
                  {searchResults.map((result) => (
                    <SearchResult
                      key={result.id}
                      result={result}
                      type={
                        searchType === "users"
                          ? "user"
                          : searchType === "hashtags"
                          ? "hashtag"
                          : "user"
                      }
                      onClick={() => {
                        if (searchType === "users" || searchType === "all") {
                          onUserSelect?.(result);
                        } else if (searchType === "hashtags") {
                          onHashtagSelect?.(result);
                        }
                      }}
                    />
                  ))}
                </div>
              )
            ) : (
              <div className="text-center py-12 text-gray-500">
                <p>Searching...</p>
              </div>
            )}
          </>
        ) : (
          <div className="p-4 space-y-6">
            <RecentSearches
              searches={recentSearches}
              onSelect={(search) => setSearchQuery(search.query)}
              onDelete={() => {}}
            />

            <TrendingSearches trending={trendingSearches} />
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default SearchPage;
