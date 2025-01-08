"use client"

import { motion } from "framer-motion"

export default function SwachhBharatSpinner() {
  return (
    <div className="flex items-center justify-center w-20 h-20">
      <motion.div
        className="relative w-full h-full"
        animate={{ rotate: 360 }}
        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
      >
        {/* Outer circle (Chakra) */}
        <div className="absolute inset-0 border-4 border-blue-600 rounded-full" />
        
        {/* Inner spokes (resembling broom bristles) */}
        {[...Array(24)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-8 bg-orange-500 rounded-full origin-bottom"
            style={{
              top: "10%",
              left: "50%",
              transformOrigin: "50% 100%",
              transform: `rotate(${i * 15}deg) translateX(-50%)`,
            }}
            animate={{ scaleY: [1, 0.8, 1] }}
            transition={{
              duration: 1,
              repeat: Infinity,
              delay: i * 0.04,
              ease: "easeInOut",
            }}
          />
        ))}
        
        {/* Center circle */}
        <div className="absolute inset-0 m-auto w-6 h-6 bg-green-500 rounded-full" />
      </motion.div>
    </div>
  )
}