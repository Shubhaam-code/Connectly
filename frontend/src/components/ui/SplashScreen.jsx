import React from 'react'
import { motion } from 'framer-motion'

export const SplashScreen = () => {
  return (
    <div className="fixed inset-0 w-screen h-screen bg-[var(--background)] flex flex-col items-center justify-between py-16 z-[9999] select-none">
      {/* Background radial glowing effect */}
      <div className="absolute top-[50%] left-[50%] -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(124,58,237,0.12) 0%, transparent 70%)' }} />

      {/* Main logo and branding in center */}
      <div className="flex-1 flex flex-col items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="flex flex-col items-center"
        >
          {/* Logo container */}
          <div className="w-24 h-24 md:w-32 md:h-32 mb-6 p-[2px] bg-gradient-to-tr from-yellow-500 via-pink-500 to-purple-600 rounded-3xl animate-pulse">
            <div className="w-full h-full rounded-3xl bg-black overflow-hidden flex items-center justify-center p-3">
              <img
                src="/favicon.png"
                alt="Connectly Logo"
                className="w-full h-full object-contain"
              />
            </div>
          </div>

          {/* Connectly title */}
          <h1 className="text-4xl md:text-5xl font-black tracking-widest connectly-gradient-text">
            CONNECTLY
          </h1>

          {/* Connecting People subtitle */}
          <p className="text-xs text-gray-500 mt-2.5 tracking-[0.25em] uppercase font-semibold">
            Connecting People...
          </p>
        </motion.div>
      </div>

      {/* Bottom attribution (from Connectly Team) */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.8 }}
        className="flex flex-col items-center gap-1 z-10"
      >
        <span className="text-[10px] text-gray-600 uppercase tracking-widest font-bold">from</span>
        <span className="text-xs font-bold tracking-wider connectly-gradient-text">
          CONNECTLY TEAM
        </span>
      </motion.div>
    </div>
  )
}

export default SplashScreen
