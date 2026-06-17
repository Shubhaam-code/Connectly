import React from "react";
import { motion } from "framer-motion";
import Sidebar from "./Sidebar";
import { useIsMobile } from "../../hooks/useCustom";
import FloatingMessenger from "../messages/FloatingMessenger";
import { useSelector } from "react-redux";

export const Layout = ({ children }) => {
  const isMobile = useIsMobile();
  const { selectedUser } = useSelector((state) => state.message || {});

  const isChatPage = window.location.pathname === "/messages" || 
                     window.location.pathname === "/chat" || 
                     window.location.pathname === "/messageArea";
  
  const isChatOpenOnMobile = isMobile && selectedUser && isChatPage;

  return (
    <div className="flex h-screen bg-[var(--background)] text-[var(--text)] overflow-hidden">
      <Sidebar />
      <main 
        className={`flex-1 h-full relative ${isChatPage ? "overflow-hidden" : "overflow-y-auto"}`} 
        style={{ paddingBottom: (isMobile && !isChatOpenOnMobile) ? "calc(72px + env(safe-area-inset-bottom))" : "0px" }}
      >
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="h-full"
        >
          {children}
        </motion.div>
        {!isMobile && (
          <>
            <FloatingMessenger />
          </>
        )}
      </main>
    </div>
  );
};

export default Layout;
