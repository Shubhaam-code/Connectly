// Animation constants
export const ANIMATIONS = {
  SIDEBAR_COLLAPSE: { duration: 0.3, ease: "easeInOut" },
  MODAL_ENTER: { duration: 0.25, ease: "easeOut" },
  MODAL_EXIT: { duration: 0.2, ease: "easeIn" },
  PAGE_TRANSITION: { duration: 0.3, ease: "easeInOut" },
  STORY_SWIPE: { duration: 0.4, ease: "easeOut" },
  HOVER_SCALE: { duration: 0.2 },
  SLIDE_IN: { duration: 0.3, ease: "easeOut" },
};

// Z-index levels
export const Z_INDEX = {
  DROPDOWN: 10,
  MODAL: 100,
  SIDEBAR: 20,
  TOAST: 200,
  TOOLTIP: 30,
};

// Breakpoints
export const BREAKPOINTS = {
  SM: 640,
  MD: 768,
  LG: 1024,
  XL: 1280,
};

// Time constants
export const TIME_CONSTANTS = {
  STORY_DURATION: 5000, // 5 seconds
  TYPING_TIMEOUT: 3000,
  DEBOUNCE_DELAY: 300,
  TOAST_DURATION: 3000,
};

// API endpoints
export const API_ENDPOINTS = {
  POSTS: "/api/posts",
  STORIES: "/api/stories",
  MESSAGES: "/api/messages",
  NOTIFICATIONS: "/api/notifications",
  USERS: "/api/users",
  COMMENTS: "/api/comments",
};
