import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiHeart,
  FiMessageCircle,
  FiUserPlus,
  FiFeather,
  FiShare2,
  FiX,
} from "react-icons/fi";
import { Avatar, Button, Divider } from "../ui/UIComponents";
import { formatTime } from "../../utils/formatters";

const NOTIFICATION_TYPES = {
  LIKE: "like",
  COMMENT: "comment",
  FOLLOW: "follow",
  MENTION: "mention",
  SHARE: "share",
  STORY_LIKE: "story_like",
};

const NotificationIcon = ({ type, className = "" }) => {
  const icons = {
    [NOTIFICATION_TYPES.LIKE]: <FiHeart className={`text-red-500 ${className}`} />,
    [NOTIFICATION_TYPES.COMMENT]: <FiMessageCircle className={`text-blue-500 ${className}`} />,
    [NOTIFICATION_TYPES.FOLLOW]: <FiUserPlus className={`text-green-500 ${className}`} />,
    [NOTIFICATION_TYPES.MENTION]: <FiFeather className={`text-yellow-500 ${className}`} />,
    [NOTIFICATION_TYPES.SHARE]: <FiShare2 className={`text-purple-500 ${className}`} />,
    [NOTIFICATION_TYPES.STORY_LIKE]: <FiHeart className={`text-pink-500 ${className}`} />,
  };

  return icons[type] || icons[NOTIFICATION_TYPES.LIKE];
};

export const NotificationItem = ({
  notification,
  onMarkAsRead,
  onFollow,
  onClick,
}) => {
  const handleRead = () => {
    if (!notification.read) {
      onMarkAsRead?.(notification._id);
    }
  };

  const getNotificationText = () => {
    const { type, users, actionType } = notification;
    const userCount = users?.length || 1;
    const firstUser = users?.[0];

    switch (type) {
      case NOTIFICATION_TYPES.LIKE:
        return userCount === 1
          ? `${firstUser?.username} liked your post`
          : `${firstUser?.username} and ${userCount - 1} others liked your post`;
      case NOTIFICATION_TYPES.COMMENT:
        return userCount === 1
          ? `${firstUser?.username} commented on your post`
          : `${firstUser?.username} and ${userCount - 1} others commented`;
      case NOTIFICATION_TYPES.FOLLOW:
        return userCount === 1
          ? `${firstUser?.username} started following you`
          : `${firstUser?.username} and ${userCount - 1} others started following you`;
      case NOTIFICATION_TYPES.MENTION:
        return `${firstUser?.username} mentioned you`;
      case NOTIFICATION_TYPES.SHARE:
        return `${firstUser?.username} shared your post`;
      case NOTIFICATION_TYPES.STORY_LIKE:
        return `${firstUser?.username} liked your story`;
      default:
        return "New notification";
    }
  };

  return (
    <motion.div
      onClick={() => {
        handleRead();
        onClick?.();
      }}
      className={`p-3 cursor-pointer hover:bg-gray-50 transition-colors border-b last:border-b-0 ${!notification.read ? "bg-blue-50" : ""
        }`}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      whileHover={{ x: 5 }}
    >
      <div className="flex items-start space-x-3">
        {/* Avatar stack */}
        <div className="relative flex-shrink-0">
          {notification.users?.length > 1 ? (
            <>
              <Avatar
                src={notification.users[0]?.profilePic}
                alt={notification.users[0]?.username}
                size="md"
              />
              <Avatar
                src={notification.users[1]?.profilePic}
                alt={notification.users[1]?.username}
                size="sm"
                className="absolute -bottom-1 -right-1 border-2 border-white"
              />
            </>
          ) : (
            <Avatar
              src={notification.users?.[0]?.profilePic}
              alt={notification.users?.[0]?.username}
              size="md"
            />
          )}
          <div className="absolute -bottom-2 -right-2 bg-white rounded-full p-1">
            <NotificationIcon type={notification.type} className="w-4 h-4" />
          </div>
        </div>

        {/* Notification content */}
        <div className="flex-1 min-w-0">
          <p className="text-sm text-gray-800">
            <span className="font-semibold">{getNotificationText()}</span>
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {formatTime(notification.createdAt)}
          </p>
        </div>

        {/* Action or thumbnail */}
        {notification.type === NOTIFICATION_TYPES.FOLLOW ? (
          <Button
            size="sm"
            variant="primary"
            onClick={(e) => {
              e.stopPropagation();
              onFollow?.(notification.users?.[0]?._id);
            }}
          >
            Follow Back
          </Button>
        ) : notification.image ? (
          <img
            src={notification.image}
            alt="notification"
            className="w-12 h-12 object-cover rounded"
          />
        ) : null}
      </div>
    </motion.div>
  );
};

export const NotificationGroup = ({
  title,
  notifications,
  type,
  onMarkAsRead,
  onFollow,
  onNotificationClick,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <motion.div className="mb-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <motion.button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-3 hover:bg-gray-50 font-semibold text-gray-800 sticky top-0 bg-white z-10 border-b"
        whileHover={{ x: 5 }}
      >
        <div className="flex items-center space-x-2">
          <NotificationIcon type={type} className="w-5 h-5" />
          <span>{title}</span>
          {unreadCount > 0 && (
            <motion.span
              className="ml-2 px-2 py-1 bg-red-500 text-white text-xs rounded-full"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
            >
              {unreadCount}
            </motion.span>
          )}
        </div>
        <motion.div
          animate={{ rotate: isExpanded ? 0 : -90 }}
          transition={{ duration: 0.2 }}
        >
          ▼
        </motion.div>
      </motion.button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            {notifications.map((notification) => (
              <NotificationItem
                key={notification._id}
                notification={notification}
                onMarkAsRead={onMarkAsRead}
                onFollow={onFollow}
                onClick={() => onNotificationClick?.(notification)}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export const NotificationsPage = ({
  notifications = [],
  currentUser,
  onMarkAsRead,
  onMarkAllAsRead,
  onFollow,
  onNotificationClick,
  isLoading = false,
}) => {
  // Group notifications by type
  const groupedNotifications = notifications.reduce((acc, notification) => {
    const type = notification.type;
    if (!acc[type]) {
      acc[type] = [];
    }
    acc[type].push(notification);
    return acc;
  }, {});

  const notificationGroups = [
    {
      type: NOTIFICATION_TYPES.LIKE,
      title: "Likes",
      notifications: groupedNotifications[NOTIFICATION_TYPES.LIKE] || [],
    },
    {
      type: NOTIFICATION_TYPES.COMMENT,
      title: "Comments",
      notifications: groupedNotifications[NOTIFICATION_TYPES.COMMENT] || [],
    },
    {
      type: NOTIFICATION_TYPES.FOLLOW,
      title: "Follow Requests",
      notifications: groupedNotifications[NOTIFICATION_TYPES.FOLLOW] || [],
    },
    {
      type: NOTIFICATION_TYPES.MENTION,
      title: "Mentions",
      notifications: groupedNotifications[NOTIFICATION_TYPES.MENTION] || [],
    },
    {
      type: NOTIFICATION_TYPES.SHARE,
      title: "Shares",
      notifications: groupedNotifications[NOTIFICATION_TYPES.SHARE] || [],
    },
    {
      type: NOTIFICATION_TYPES.STORY_LIKE,
      title: "Story Likes",
      notifications: groupedNotifications[NOTIFICATION_TYPES.STORY_LIKE] || [],
    },
  ];

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <motion.div
      className="max-w-2xl mx-auto bg-white min-h-screen"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      {/* Header */}
      <div className="sticky top-0 bg-white border-b z-20">
        <div className="p-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Notifications</h1>
          {unreadCount > 0 && (
            <Button
              size="sm"
              variant="ghost"
              onClick={onMarkAllAsRead}
            >
              Mark all as read
            </Button>
          )}
        </div>
      </div>

      {/* Notifications */}
      <div className="p-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
          </div>
        ) : notificationGroups.some((g) => g.notifications.length > 0) ? (
          <AnimatePresence>
            {notificationGroups.map(
              (group) =>
                group.notifications.length > 0 && (
                  <NotificationGroup
                    key={group.type}
                    title={group.title}
                    type={group.type}
                    notifications={group.notifications}
                    onMarkAsRead={onMarkAsRead}
                    onFollow={onFollow}
                    onNotificationClick={onNotificationClick}
                  />
                )
            )}
          </AnimatePresence>
        ) : (
          <div className="text-center py-12 text-gray-500">
            <FiBell size={48} className="mx-auto mb-4 opacity-30" />
            <p>No notifications yet</p>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default NotificationsPage;
