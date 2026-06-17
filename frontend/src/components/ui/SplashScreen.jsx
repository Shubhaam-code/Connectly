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
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.2, ease: "easeInOut" }}
          className="flex flex-col items-center justify-center"
        >
          {/* Logo with drop-shadow glow */}
          <div className="relative mb-6">
            <img
              src="/favicon.png"
              alt="Connectly Logo"
              className="w-32 h-32 md:w-40 md:h-40 object-contain filter drop-shadow-[0_0_25px_rgba(139,92,246,0.3)]"
            />
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
