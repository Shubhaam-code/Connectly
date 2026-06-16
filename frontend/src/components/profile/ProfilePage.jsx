import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  FiMessageSquare,
  FiShare2,
  FiMoreHorizontal,
  FiGrid,
  FiVideo,
  FiBookmark,
} from "react-icons/fi";
import { Avatar, Button, Badge } from "../ui/UIComponents";
import { PostCard } from "../posts/PostModal";

export const ProfileHeader = ({
  user,
  isOwnProfile,
  isFollowing,
  onFollow,
  onEditProfile,
  onMessage,
}) => {
  return (
    <motion.div
      className="bg-white border-b p-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="max-w-5xl mx-auto">
        <div className="flex items-start space-x-8">
          {/* Avatar */}
          <motion.div
            className="relative"
            whileHover={{ scale: 1.05 }}
          >
            <Avatar
              src={user.profilePic}
              alt={user.username}
              size="xl"
            />
            {user.isOnline && (
              <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 rounded-full border-4 border-white" />
            )}
          </motion.div>

          {/* User info */}
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-4">
              <h1 className="text-2xl font-bold">{user.username}</h1>
              {user.isVerified && (
                <Badge variant="success">✓ Verified</Badge>
              )}
              <motion.button
                className="p-2 hover:bg-gray-100 rounded-full"
                whileHover={{ scale: 1.1 }}
              >
                <FiMoreHorizontal size={20} />
              </motion.button>
            </div>

            {/* Action buttons */}
            <div className="flex items-center space-x-2 mb-4">
              {isOwnProfile ? (
                <>
                  <Button onClick={onEditProfile} variant="secondary" size="md">
                    Edit Profile
                  </Button>
                  <Button variant="secondary" size="md">
                    Share Profile
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    onClick={() => onFollow?.()}
                    variant={isFollowing ? "secondary" : "primary"}
                    size="md"
                  >
                    {isFollowing ? "Following" : "Follow"}
                  </Button>
                  <Button onClick={onMessage} variant="secondary" size="md">
                    <FiMessageSquare className="inline mr-2" />
                    Message
                  </Button>
                  <Button variant="secondary" size="md">
                    <FiShare2 className="inline mr-2" />
                  </Button>
                </>
              )}
            </div>

            {/* Stats */}
            <div className="flex items-center space-x-8 mb-4">
              <div className="text-center">
                <p className="font-bold text-lg">{user.postsCount || 0}</p>
                <p className="text-sm text-gray-600">Posts</p>
              </div>
              <div className="text-center cursor-pointer hover:text-blue-600">
                <p className="font-bold text-lg">{user.followersCount || 0}</p>
                <p className="text-sm text-gray-600">Followers</p>
              </div>
              <div className="text-center cursor-pointer hover:text-blue-600">
                <p className="font-bold text-lg">{user.followingCount || 0}</p>
                <p className="text-sm text-gray-600">Following</p>
              </div>
            </div>

            {/* Bio */}
            <div>
              <p className="font-semibold">{user.name}</p>
              <p className="text-gray-700 whitespace-pre-line">{user.bio}</p>
              {user.website && (
                <a
                  href={user.website}
                  className="text-blue-600 hover:underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {user.website}
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export const StoryHighlights = ({ highlights = [] }) => {
  return (
    <motion.div
      className="bg-white border-b p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <div className="max-w-5xl mx-auto">
        <div className="flex space-x-4 overflow-x-auto pb-4">
          {highlights.map((highlight, idx) => (
            <motion.div
              key={idx}
              className="flex flex-col items-center cursor-pointer"
              whileHover={{ scale: 1.08 }}
            >
              <div className="w-16 h-16 rounded-full border-2 border-gray-300 p-1 flex items-center justify-center bg-gray-100 hover:border-gray-400">
                <img
                  src={highlight.cover}
                  alt={highlight.title}
                  className="w-full h-full rounded-full object-cover"
                />
              </div>
              <p className="text-xs mt-2 text-center truncate w-16">
                {highlight.title}
              </p>
            </motion.div>
          ))}
          <motion.div
            className="flex flex-col items-center cursor-pointer"
            whileHover={{ scale: 1.08 }}
          >
            <div className="w-16 h-16 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center text-2xl text-gray-400 hover:border-gray-500">
              +
            </div>
            <p className="text-xs mt-2 text-center w-16">New</p>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};

export const PostsGrid = ({ posts, viewMode = "grid", onPostClick }) => {
  return (
    <motion.div
      className="bg-white"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <div className="max-w-5xl mx-auto">
        {/* View mode tabs */}
        <div className="flex items-center justify-center space-x-8 border-t p-4">
          <motion.button
            className={`flex items-center space-x-2 pb-4 px-4 ${viewMode === "grid"
                ? "border-b-2 border-gray-800 text-gray-800"
                : "text-gray-400"
              }`}
            whileHover={{ scale: 1.05 }}
          >
            <FiGrid size={20} />
            <span className="text-sm font-semibold">Posts</span>
          </motion.button>
          <motion.button
            className={`flex items-center space-x-2 pb-4 px-4 ${viewMode === "reels"
                ? "border-b-2 border-gray-800 text-gray-800"
                : "text-gray-400"
              }`}
            whileHover={{ scale: 1.05 }}
          >
            <FiVideo size={20} />
            <span className="text-sm font-semibold">Reels</span>
          </motion.button>
          <motion.button
            className={`flex items-center space-x-2 pb-4 px-4 ${viewMode === "saved"
                ? "border-b-2 border-gray-800 text-gray-800"
                : "text-gray-400"
              }`}
            whileHover={{ scale: 1.05 }}
          >
            <FiBookmark size={20} />
            <span className="text-sm font-semibold">Saved</span>
          </motion.button>
        </div>

        {/* Posts grid */}
        <div className="grid grid-cols-3 gap-1 p-4">
          {posts.length > 0 ? (
            posts.map((post) => (
              <motion.div
                key={post._id}
                className="aspect-square bg-gray-100 cursor-pointer overflow-hidden relative group"
                whileHover={{ scale: 1.02 }}
                onClick={() => onPostClick?.(post)}
              >
                {post.image ? (
                  <img
                    src={post.image}
                    alt="post"
                    className="w-full h-full object-cover group-hover:opacity-75 transition-opacity"
                  />
                ) : post.video ? (
                  <video
                    src={post.video}
                    className="w-full h-full object-cover group-hover:opacity-75 transition-opacity"
                  />
                ) : null}

                {/* Hover overlay */}
                <motion.div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <div className="flex space-x-4 text-white">
                    <div className="text-center">
                      <p className="text-lg">❤️</p>
                      <p className="text-xs">{post.likes?.length || 0}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg">💬</p>
                      <p className="text-xs">{post.comments?.length || 0}</p>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            ))
          ) : (
            <div className="col-span-3 text-center py-12 text-gray-500">
              <p>No posts yet</p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export const ProfilePage = ({
  user,
  posts = [],
  highlights = [],
  isOwnProfile = true,
  isFollowing = false,
  onFollow,
  onEditProfile,
  onMessage,
  onPostClick,
}) => {
  const [viewMode, setViewMode] = useState("grid");

  return (
    <motion.div
      className="min-h-screen bg-white"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <ProfileHeader
        user={user}
        isOwnProfile={isOwnProfile}
        isFollowing={isFollowing}
        onFollow={onFollow}
        onEditProfile={onEditProfile}
        onMessage={onMessage}
      />

      {highlights.length > 0 && (
        <StoryHighlights highlights={highlights} />
      )}

      <PostsGrid
        posts={posts}
        viewMode={viewMode}
        onPostClick={onPostClick}
      />
    </motion.div>
  );
};

export default ProfilePage;
