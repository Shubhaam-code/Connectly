import React, { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  FiHome,
  FiCompass,
  FiSearch,
  FiMessageCircle,
  FiBell,
  FiPlusSquare,
  FiSettings,
  FiLogOut,
  FiFileText,
  FiPlus
} from "react-icons/fi";
import { useIsMobile } from "../../hooks/useCustom";
import { setUserData } from "../../redux/userSlice";
import axiosInstance from "../../lib/axiosInstance";
import dp from "../../assets/dp.webp";
import AccountSwitcherModal from "./AccountSwitcherModal";
import { Avatar } from "../ui/UIComponents";
export const Sidebar = () => {
  const [isTablet, setIsTablet] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isSwitcherOpen, setIsSwitcherOpen] = useState(false);
  const { userData, notificationData } = useSelector((state) => state.user);
  const { prevChatUsers, selectedUser } = useSelector((state) => state.message);
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const isMobile = useIsMobile();

  const isChatOpenOnMobile = isMobile && selectedUser && 
    (location.pathname === "/messages" || location.pathname === "/chat" || location.pathname === "/messageArea");

  // Monitor resize to auto-collapse on tablet viewports
  useEffect(() => {
    const handleResize = () => {
      setIsTablet(window.innerWidth >= 768 && window.innerWidth < 1280);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleNavigate = useCallback(
    (item) => {
      const actualPath = item.path === "/profile" ? `/profile/${userData?.userName}` : item.path;
      navigate(actualPath);
    },
    [navigate, userData]
  );

  const handleLogout = useCallback(async () => {
    try {
      await axiosInstance.get("/api/auth/signout");
    } catch (err) {
      console.error("Logout API error:", err);
    }
    dispatch(setUserData(null));
    navigate("/signin");
  }, [dispatch, navigate]);

  const isActive = (item) => {
    const path = item.path;
    if (path === "/") {
      return location.pathname === "/";
    }
    if (path === "/profile") {
      return location.pathname.startsWith("/profile");
    }
    return location.pathname === path;
  };

  const unreadMessagesCount = Array.isArray(prevChatUsers)
    ? prevChatUsers.reduce((sum, chat) => sum + (chat.unreadCount || 0), 0)
    : 0;

  const navItems = [
    { label: "Home", icon: FiHome, path: "/", id: "home" },
    { label: "Explore", icon: FiCompass, path: "/explore", id: "explore" },
    { label: "Search", icon: FiSearch, path: "/search", id: "search" },
    { label: "News", icon: FiFileText, path: "/news", id: "news" },
    { label: "Messages", icon: FiMessageCircle, path: "/messages", id: "messages" },
    { label: "Notifications", icon: FiBell, path: "/notifications", id: "notifications" },
    { label: "Create", icon: FiPlusSquare, path: "/upload", id: "create" },
    { label: "Profile", icon: null, path: "/profile", id: "profile" }
  ];

  const unreadNotifications = notificationData?.filter(n => !n.isRead).length || 0;

  const isExpanded = !isTablet && isHovered;

  // Mobile Bottom Bar Layout
  if (isMobile) {
    if (isChatOpenOnMobile) {
      return null;
    }

    const mobileNavItems = [
      { icon: FiHome, path: "/", id: "home", label: "Home" },
      { icon: FiFileText, path: "/news", id: "news", label: "News" },
      { icon: FiPlus, path: "/upload", id: "create", label: "Create" },
      { icon: FiCompass, path: "/explore", id: "explore", label: "Explore" },
      { icon: null, path: "/profile", id: "profile", label: "Profile" }
    ];

    return (
      <>
        <div 
          className="fixed bottom-0 left-0 right-0 h-[72px] z-40 px-4 pb-[env(safe-area-inset-bottom)] flex items-center justify-around select-none bg-[var(--card)]/95 backdrop-blur-2xl border-t border-[var(--border)] shadow-[0_-4px_20px_rgba(0,0,0,0.05)] dark:shadow-[0_-4px_30px_rgba(0,0,0,0.4)]"
        >
          {mobileNavItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item);

            if (item.id === "create") {
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavigate(item)}
                  className="relative -top-4 flex flex-col items-center justify-center flex-shrink-0 cursor-pointer"
                >
                  <div className="w-14 h-14 rounded-full flex items-center justify-center bg-gradient-to-r from-[#8B5CF6] to-[#EC4899] text-white hover:opacity-95 active:scale-95 transition-all duration-300 shadow-[0_4px_20px_rgba(139,92,246,0.35)] border border-white/10">
                    <motion.div
                      animate={{ scale: active ? 1.15 : 1 }}
                      whileTap={{ scale: 0.95 }}
                      transition={{ type: "spring", stiffness: 400, damping: 17 }}
                    >
                      <Icon size={26} className="stroke-[3]" />
                    </motion.div>
                  </div>
                  <span className="text-[9px] mt-1 text-[var(--text-secondary)]/80 font-bold uppercase tracking-wider">
                    {item.label}
                  </span>
                </button>
              );
            }

            return (
              <button
                key={item.id}
                onClick={() => handleNavigate(item)}
                className="relative p-2 flex flex-col items-center justify-center cursor-pointer flex-shrink-0"
              >
                <motion.div
                  animate={{ 
                    scale: active ? 1.15 : 1,
                  }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ type: "spring", stiffness: 400, damping: 20 }}
                  className="flex flex-col items-center justify-center"
                >
                  {item.id === "profile" ? (
                    <div className={`w-6.5 h-6.5 rounded-full overflow-hidden border-2 transition-colors duration-300 ${active ? "border-[var(--primary)]" : "border-[var(--border)]"}`}>
                      <Avatar
                        src={userData?.profileImage || dp}
                        alt="profile"
                        size="w-full h-full"
                        className="w-full h-full hover:scale-100"
                      />
                    </div>
                  ) : (
                    <Icon 
                      size={22} 
                      className={`transition-colors duration-300 ${active ? "text-[var(--primary)] stroke-[2.5]" : "text-[var(--text-secondary)] opacity-80"}`} 
                    />
                  )}
                  <span 
                    className={`text-[9px] mt-1 transition-all duration-300 font-bold uppercase tracking-wider ${
                      active 
                        ? "bg-gradient-to-r from-[#8B5CF6] to-[#EC4899] bg-clip-text text-transparent" 
                        : "text-[var(--text-secondary)]/80"
                    }`}
                  >
                    {item.label}
                  </span>
                </motion.div>
              </button>
            );
          })}
        </div>
        <NewsModal isOpen={isNewsOpen} onClose={() => setIsNewsOpen(false)} />
      </>
    );
  }

  // Desktop/Tablet Sidebar Layout
  return (
    <motion.div
      onMouseEnter={() => !isTablet && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      animate={{ width: isExpanded ? 260 : 72 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className={`h-screen bg-[var(--background)]/90 backdrop-blur-xl border-r border-[var(--border)] flex flex-col justify-between overflow-hidden flex-shrink-0 text-[var(--text)] relative ${
        isSwitcherOpen ? 'z-[950]' : 'z-20'
      }`}
    >
      <div>
        {/* Logo Section */}
        <div 
          className={`h-20 flex items-center border-b border-[var(--border)] cursor-pointer transition-all duration-300 gap-3.5 ${isExpanded ? "justify-start px-6" : "justify-center"}`}
          onClick={() => navigate("/")}
        >
          <img
            src="/logo.svg"
            alt="Connectly Icon"
            className="w-9 h-9 object-contain flex-shrink-0 transition-transform duration-300 hover:rotate-12"
          />
          {isExpanded && (
            <span className="text-lg font-black tracking-tight font-sans bg-gradient-to-r from-[var(--text)] to-[var(--primary)] bg-clip-text text-transparent">
              Connectly
            </span>
          )}
        </div>

        {/* Navigation Section */}
        <nav className="p-3 space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item);

            return (
              <button
                key={item.id}
                onClick={() => handleNavigate(item)}
                className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all relative group cursor-pointer ${
                  active 
                    ? "bg-gradient-to-r from-purple-500/10 to-pink-500/5 text-[var(--primary)] dark:text-[#A855F7] border border-purple-500/20 shadow-[0_4px_20px_rgba(139,92,246,0.08)]" 
                    : "text-[var(--text-secondary)] hover:bg-white/5 hover:text-[var(--text)] transition-all duration-300"
                }`}
              >
                {/* Neon highlight bar on the left */}
                {active && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-7 rounded-r-full bg-gradient-to-b from-[#8B5CF6] to-[#EC4899] shadow-[0_0_12px_rgba(139,92,246,0.8)]" />
                )}

                {item.id === "profile" ? (
                  <div className={`w-6.5 h-6.5 rounded-full overflow-hidden flex-shrink-0 border-2 transition-colors duration-300 ${active ? "border-[#8B5CF6]" : "border-white/10"}`}>
                    <Avatar
                      src={userData?.profileImage || dp}
                      alt="profile"
                      size="w-full h-full"
                      className="w-full h-full hover:scale-100"
                    />
                  </div>
                ) : (
                  <div className="relative">
                    <Icon size={21} className={active ? "text-[#8B5CF6] stroke-[2.5]" : "text-[var(--text-secondary)] group-hover:text-[var(--text)] transition-colors duration-300"} />
                    {item.id === "notifications" && unreadNotifications > 0 && (
                      <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full w-4 h-4 text-[9px] flex items-center justify-center font-bold shadow-[0_0_8px_rgba(239,68,68,0.5)]">
                        {unreadNotifications > 9 ? "9+" : unreadNotifications}
                      </span>
                    )}

                    {/* Message count */}
                    {item.id === "messages" && unreadMessagesCount > 0 && (
                      <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full w-4 h-4 text-[9px] flex items-center justify-center font-bold shadow-[0_0_8px_rgba(239,68,68,0.5)]">
                        {unreadMessagesCount > 9 ? "9+" : unreadMessagesCount}
                      </span>
                    )}
                  </div>
                )}

                <AnimatePresence>
                  {isExpanded && (
                    <motion.span
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      transition={{ duration: 0.2 }}
                      className={`text-sm tracking-wide truncate ${active ? "font-bold text-[#8B5CF6] dark:text-[#A855F7]" : "text-[var(--text-secondary)] group-hover:text-[var(--text)] transition-colors duration-300"}`}
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>

                {/* Collapsed Tooltip */}
                {!isExpanded && (
                  <div className="absolute left-16 top-1/2 -translate-y-1/2 bg-[#0B1220]/95 border border-white/10 text-white text-xs px-3 py-2 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50 shadow-2xl backdrop-blur-md">
                    {item.label}
                  </div>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer Settings/Logout Section */}
      <div className="p-3 border-t border-[var(--border)] space-y-1.5">
        <button
          onClick={() => navigate("/settings")}
          className="w-full flex items-center gap-4 px-4 py-3 text-[var(--text-secondary)] hover:text-[var(--text)] hover:bg-white/5 rounded-xl transition-all group relative cursor-pointer"
        >
          <FiSettings size={21} className="text-[var(--text-secondary)] group-hover:text-[var(--text)] transition-colors" />
          <AnimatePresence>
            {isExpanded && (
              <motion.span
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
                className="text-sm font-semibold truncate"
              >
                Settings
              </motion.span>
            )}
          </AnimatePresence>
          {!isExpanded && (
            <div className="absolute left-16 top-1/2 -translate-y-1/2 bg-[#0B1220]/95 border border-white/10 text-white text-xs px-3 py-2 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50 shadow-2xl backdrop-blur-md">
              Settings
            </div>
          )}
        </button>

        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-4 px-4 py-3 text-[var(--danger)] hover:bg-[var(--danger)]/10 rounded-xl transition-all group relative cursor-pointer"
        >
          <FiLogOut size={21} />
          <AnimatePresence>
            {isExpanded && (
              <motion.span
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
                className="text-sm font-semibold truncate"
              >
                Logout
              </motion.span>
            )}
          </AnimatePresence>
          {!isExpanded && (
            <div className="absolute left-16 top-1/2 -translate-y-1/2 bg-[#0B1220]/95 border border-white/10 text-white text-xs px-3 py-2 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50 shadow-2xl backdrop-blur-md">
              Logout
            </div>
          )}
        </button>

        {/* User Profile Card */}
        {userData && (
          <div
            className="mt-2 p-2 flex items-center justify-between gap-3 cursor-pointer hover:bg-white/5 rounded-xl transition-all relative group min-w-0 border border-transparent hover:border-purple-500/10"
            onClick={() => setIsSwitcherOpen(true)}
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="relative flex-shrink-0">
                <div className="w-10 h-10 rounded-full overflow-hidden border border-white/10">
                  <img src={userData.profileImage || dp} alt="" className="w-full h-full object-cover" />
                </div>
                <div className="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-[#0B1220] bg-green-500 shadow-[0_0_10px_#22c55e]" />
              </div>
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.2 }}
                    className="truncate text-left"
                  >
                    <p className="text-xs font-bold text-[var(--text)] truncate">{userData.name}</p>
                    <p className="text-[10px] text-[var(--text-secondary)] truncate">@{userData.userName}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <AnimatePresence>
              {isExpanded && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-[var(--text-secondary)] hover:text-[var(--text)] transition-colors text-xs font-semibold select-none mr-1"
                >
                  •••
                </motion.span>
              )}
            </AnimatePresence>
            {!isExpanded && (
              <div className="absolute left-16 top-1/2 -translate-y-1/2 bg-[#0B1220]/95 border border-white/10 text-white text-xs px-3 py-2 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50 shadow-2xl backdrop-blur-md">
                Switch Accounts
              </div>
            )}
          </div>
        )}
      </div>

      <AccountSwitcherModal isOpen={isSwitcherOpen} onClose={() => setIsSwitcherOpen(false)} />
    </motion.div>
  );
};

export default Sidebar;
