import React from "react";
import { motion } from "framer-motion";
import Sidebar from "./Sidebar";
import { useIsMobile } from "../../hooks/useCustom";
import FloatingMessenger from "../messages/FloatingMessenger";
import AIFriendWidget from "../friend/AIFriendWidget";

export const Layout = ({ children }) => {
  const isMobile = useIsMobile();

  return (
    <div className="flex h-screen bg-[var(--background)] text-[var(--text)] overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto h-full relative" style={{ paddingBottom: isMobile ? "64px" : "0px" }}>
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
            <AIFriendWidget />
          </>
        )}
      </main>
    </div>
  );
};

export default Layout;
