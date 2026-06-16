import React, { useState, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
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
  FiMenu,
  FiChevronLeft,
  FiChevronRight
} from "react-icons/fi";
import { useIsMobile } from "../../hooks/useCustom";
import { setUserData } from "../../redux/userSlice";
import axiosInstance from "../../lib/axiosInstance";
import dp from "../../assets/dp.webp";
import AccountSwitcherModal from "./AccountSwitcherModal";
import { Avatar } from "../ui/UIComponents";

export const Sidebar = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isSwitcherOpen, setIsSwitcherOpen] = useState(false);
  const { userData, notificationData } = useSelector((state) => state.user);
  const { prevChatUsers } = useSelector((state) => state.message);
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const isMobile = useIsMobile();

  // Auto-collapse on tablet screens
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768 && window.innerWidth <= 1024) {
        setIsCollapsed(true);
      } else if (window.innerWidth > 1024) {
        setIsCollapsed(false);
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleNavigate = useCallback(
    (path) => {
      const actualPath = path === "/profile" ? `/profile/${userData?.userName}` : path;
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

  const isActive = (path) => {
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
    { label: "Messages", icon: FiMessageCircle, path: "/messages", id: "messages" },
    { label: "Notifications", icon: FiBell, path: "/notifications", id: "notifications" },
    { label: "Create", icon: FiPlusSquare, path: "/upload", id: "create" },
    { label: "Profile", icon: null, path: "/profile", id: "profile" } // Render avatar instead of icon
  ];

  const unreadNotifications = notificationData?.filter(n => !n.isRead).length || 0;

  // Mobile Bottom Bar Layout
  if (isMobile) {
    return (
      <div className="fixed bottom-0 left-0 right-0 h-16 bg-[var(--background)] border-t border-[var(--border)] flex items-center justify-around z-40 px-2 text-[var(--text)]">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);

          return (
            <button
              key={item.id}
              onClick={() => handleNavigate(item.path)}
              className="relative p-3 flex items-center justify-center text-[var(--text)]"
            >
              {item.id === "profile" ? (
                <div className={`w-7 h-7 rounded-full overflow-hidden border ${active ? "border-[var(--text)]" : "border-transparent"}`}>
                  <Avatar
                    src={userData?.profileImage || dp}
                    alt="profile"
                    size="w-full h-full"
                    className="w-full h-full hover:scale-100"
                  />
                </div>
              ) : (
                <Icon size={24} className={active ? "stroke-[2.5]" : "opacity-80"} />
              )}

              {/* Notification count */}
              {item.id === "notifications" && unreadNotifications > 0 && (
                <span className="absolute top-1.5 right-1.5 bg-red-500 text-white rounded-full w-4 h-4 text-[9px] flex items-center justify-center font-bold">
                  {unreadNotifications > 9 ? "9+" : unreadNotifications}
                </span>
              )}

              {/* Message count */}
              {item.id === "messages" && unreadMessagesCount > 0 && (
                <span className="absolute top-1.5 right-1.5 bg-red-500 text-white rounded-full w-4 h-4 text-[9px] flex items-center justify-center font-bold">
                  {unreadMessagesCount > 9 ? "9+" : unreadMessagesCount}
                </span>
              )}
            </button>
          );
        })}
      </div>
    );
  }

  // Desktop Sidebar Layout
  return (
    <motion.div
      animate={{ width: isCollapsed ? 72 : 244 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className="h-screen bg-[var(--background)] border-r border-[var(--border)] z-20 flex flex-col justify-between overflow-hidden flex-shrink-0 text-[var(--text)]"
    >
      <div>
        {/* Logo Section */}
        <div className="h-20 px-6 flex items-center justify-between border-b border-[var(--border)]">
          {!isCollapsed ? (
            <div
              onClick={() => navigate("/")}
              className="flex items-center gap-2.5 cursor-pointer"
            >
              <img
                src="/favicon.png"
                alt="Connectly Icon"
                className="w-8 h-8 object-contain flex-shrink-0"
              />
              <motion.h1
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-xl font-black tracking-wider connectly-gradient-text"
              >
                CONNECTLY
              </motion.h1>
            </div>
          ) : (
            <div
              onClick={() => navigate("/")}
              className="cursor-pointer mx-auto flex items-center justify-center"
            >
              <img
                src="/favicon.png"
                alt="Connectly Icon"
                className="w-8 h-8 object-contain flex-shrink-0"
              />
            </div>
          )}
        </div>

        {/* Navigation Section */}
        <nav className="p-3 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);

            return (
              <button
                key={item.id}
                onClick={() => handleNavigate(item.path)}
                className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all relative group text-[var(--text)] hover:bg-[var(--hover)] ${
                  active ? "bg-[var(--primary)]/10" : ""
                }`}
              >
                {active && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-[#8B5CF6] to-[#EC4899] rounded-r-md shadow-[0_0_10px_rgba(139,92,246,0.8)]" />
                )}

                {item.id === "profile" ? (
                  <div className={`w-6 h-6 rounded-full overflow-hidden flex-shrink-0 border ${active ? "border-[var(--text)]" : "border-transparent"}`}>
                    <Avatar
                      src={userData?.profileImage || dp}
                      alt="profile"
                      size="w-full h-full"
                      className="w-full h-full hover:scale-100"
                    />
                  </div>
                ) : (
                  <div className="relative">
                    <Icon size={22} className={active ? "text-[var(--text)] stroke-[2.5]" : "text-[var(--text-secondary)] group-hover:text-[var(--text)] transition-colors"} />
                    {item.id === "notifications" && unreadNotifications > 0 && (
                      <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full w-4 h-4 text-[9px] flex items-center justify-center font-bold">
                        {unreadNotifications > 9 ? "9+" : unreadNotifications}
                      </span>
                    )}

                    {/* Message count */}
                    {item.id === "messages" && unreadMessagesCount > 0 && (
                      <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full w-4 h-4 text-[9px] flex items-center justify-center font-bold">
                        {unreadMessagesCount > 9 ? "9+" : unreadMessagesCount}
                      </span>
                    )}
                  </div>
                )}

                {!isCollapsed && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className={`text-sm ${active ? "font-bold text-[var(--text)]" : "text-[var(--text)] font-normal"}`}
                  >
                    {item.label}
                  </motion.span>
                )}

                {/* Collapsed Tooltip */}
                {isCollapsed && (
                  <div className="absolute left-16 top-1/2 -translate-y-1/2 bg-[var(--card)] text-[var(--text)] border border-[var(--border)] text-xs px-2.5 py-1.5 rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 shadow-lg">
                    {item.label}
                  </div>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer Settings/Logout Section */}
      <div className="p-3 border-t border-[var(--border)] space-y-1">
        <button
          onClick={() => navigate("/settings")}
          className="w-full flex items-center gap-4 px-4 py-3 text-[var(--text)] hover:bg-[var(--hover)] rounded-xl transition-all group relative"
        >
          <FiSettings size={22} className="text-[var(--text-secondary)] group-hover:text-[var(--text)] transition-colors" />
          {!isCollapsed && <span className="text-sm text-[var(--text)]">Settings</span>}
          {isCollapsed && (
            <div className="absolute left-16 top-1/2 -translate-y-1/2 bg-[var(--card)] text-[var(--text)] border border-[var(--border)] text-xs px-2.5 py-1.5 rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
              Settings
            </div>
          )}
        </button>

        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-4 px-4 py-3 text-[var(--danger)] hover:bg-[var(--danger)]/10 rounded-xl transition-all group relative cursor-pointer"
        >
          <FiLogOut size={22} />
          {!isCollapsed && <span className="text-sm font-semibold">Logout</span>}
          {isCollapsed && (
            <div className="absolute left-16 top-1/2 -translate-y-1/2 bg-[var(--card)] text-[var(--text)] border border-[var(--border)] text-xs px-2.5 py-1.5 rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
              Logout
            </div>
          )}
        </button>

        {/* Collapse Toggle Button */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="w-full flex items-center gap-4 px-4 py-3 text-[var(--text-secondary)] hover:bg-[var(--hover)] rounded-xl transition-all hidden lg:flex"
        >
          {isCollapsed ? <FiChevronRight size={22} /> : <FiChevronLeft size={22} />}
          {!isCollapsed && <span className="text-sm">Collapse sidebar</span>}
        </button>

        {/* User Profile Card */}
        {userData && (
          <div
            className="mt-2 p-2.5 border-t border-[var(--border)] flex items-center justify-between gap-3 cursor-pointer hover:bg-[var(--hover)] rounded-xl transition-all relative group min-w-0"
            onClick={() => setIsSwitcherOpen(true)}
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="relative flex-shrink-0">
                <div className="w-10 h-10 rounded-full overflow-hidden border border-[var(--border)]">
                  <img src={userData.profileImage || dp} alt="" className="w-full h-full object-cover" />
                </div>
                <div className="absolute bottom-0 right-0 w-3 h-3 rounded-full border border-[var(--background)] bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.8)]" />
              </div>
              {!isCollapsed && (
                <div className="truncate text-left">
                  <p className="text-xs font-bold text-[var(--text)] truncate">{userData.name}</p>
                  <p className="text-[10px] text-[var(--text-secondary)] truncate">@{userData.userName}</p>
                </div>
              )}
            </div>
            {!isCollapsed && (
              <span className="text-[var(--text-secondary)] hover:text-[var(--text)] transition-colors text-xs font-semibold select-none mr-1">
                •••
              </span>
            )}
            {isCollapsed && (
              <div className="absolute left-16 top-1/2 -translate-y-1/2 bg-[var(--card)] text-[var(--text)] border border-[var(--border)] text-xs px-2.5 py-1.5 rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
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
