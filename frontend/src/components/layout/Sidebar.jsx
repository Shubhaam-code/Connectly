import React, { useState, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  FiHome,
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

export const Sidebar = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
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
      <div className="fixed bottom-0 left-0 right-0 h-16 bg-[#000000] border-t border-[#262626] flex items-center justify-around z-40 px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);

          return (
            <button
              key={item.id}
              onClick={() => handleNavigate(item.path)}
              className="relative p-3 flex items-center justify-center text-white"
            >
              {item.id === "profile" ? (
                <div className={`w-7 h-7 rounded-full overflow-hidden border ${active ? "border-white" : "border-transparent"}`}>
                  <img
                    src={userData?.profileImage || dp}
                    alt="profile"
                    className="w-full h-full object-cover"
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
      className="h-screen bg-[#000000] border-r border-[#262626] z-20 flex flex-col justify-between overflow-hidden flex-shrink-0"
    >
      <div>
        {/* Logo Section */}
        <div className="h-20 px-6 flex items-center justify-between border-b border-[#121212]">
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
                className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all relative group text-white hover:bg-[#121212]`}
              >
                {item.id === "profile" ? (
                  <div className={`w-6 h-6 rounded-full overflow-hidden flex-shrink-0 border ${active ? "border-white" : "border-transparent"}`}>
                    <img
                      src={userData?.profileImage || dp}
                      alt="profile"
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="relative">
                    <Icon size={22} className={active ? "text-white stroke-[2.5]" : "text-[#A8A8A8] group-hover:text-white transition-colors"} />
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
                    className={`text-sm ${active ? "font-bold text-white" : "text-[#EFEFEF] font-normal"}`}
                  >
                    {item.label}
                  </motion.span>
                )}

                {/* Collapsed Tooltip */}
                {isCollapsed && (
                  <div className="absolute left-16 top-1/2 -translate-y-1/2 bg-[#262626] text-white text-xs px-2.5 py-1.5 rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 shadow-lg">
                    {item.label}
                  </div>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer Settings/Logout Section */}
      <div className="p-3 border-t border-[#121212] space-y-1">
        <button
          onClick={() => navigate("/settings")}
          className="w-full flex items-center gap-4 px-4 py-3 text-white hover:bg-[#121212] rounded-xl transition-all group relative"
        >
          <FiSettings size={22} className="text-[#A8A8A8] group-hover:text-white transition-colors" />
          {!isCollapsed && <span className="text-sm text-[#EFEFEF]">Settings</span>}
          {isCollapsed && (
            <div className="absolute left-16 top-1/2 -translate-y-1/2 bg-[#262626] text-white text-xs px-2.5 py-1.5 rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
              Settings
            </div>
          )}
        </button>

        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-4 px-4 py-3 text-red-500 hover:bg-red-950/20 rounded-xl transition-all group relative"
        >
          <FiLogOut size={22} />
          {!isCollapsed && <span className="text-sm font-semibold">Logout</span>}
          {isCollapsed && (
            <div className="absolute left-16 top-1/2 -translate-y-1/2 bg-[#262626] text-white text-xs px-2.5 py-1.5 rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
              Logout
            </div>
          )}
        </button>

        {/* Collapse Toggle Button */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="w-full flex items-center gap-4 px-4 py-3 text-[#A8A8A8] hover:bg-[#121212] rounded-xl transition-all hidden lg:flex"
        >
          {isCollapsed ? <FiChevronRight size={22} /> : <FiChevronLeft size={22} />}
          {!isCollapsed && <span className="text-sm">Collapse sidebar</span>}
        </button>
      </div>
    </motion.div>
  );
};

export default Sidebar;
