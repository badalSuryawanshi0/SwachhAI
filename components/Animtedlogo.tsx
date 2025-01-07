"use client";

import { motion } from "framer-motion";
import { Trash2, Recycle, Leaf } from "lucide-react";

export default function WasteSegregationAnimation() {
  return (
    <div className="relative w-96 h-80 mx-auto mb-8">
      {/* Background circle representing India */}
      <motion.div
        className="absolute inset-0 rounded-full bg-green-100"
        animate={{ scale: [1, 1.05, 1] }}
        transition={{ duration: 11, repeat: Infinity }}
      />

      {/* Waste bins */}
      <motion.div
        className="absolute bottom-0 left-1 transform -translate-x-1/2"
        animate={{ y: [0, -5, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <Trash2 className="h-16 w-16 text-gray-500" />
        <div className="text-xs font-semibold text-center mt-1 text-gray-700">
          Non-recyclable
        </div>
      </motion.div>

      <motion.div
        className="absolute bottom-0 right-2 transform -translate-x-1/2"
        animate={{ y: [0, -5, 0] }}
        transition={{ duration: 2, delay: 0.5, repeat: Infinity }}
      >
        <Recycle className="h-16 w-16 text-green-600" />
        <div className="text-xs font-semibold text-center mt-1 text-green-700">
          Recyclable
        </div>
      </motion.div>

      <motion.div
        className="absolute bottom-0 right-[40%] transform -translate-x-1/2"
        animate={{ y: [0, -5, 0] }}
        transition={{ duration: 2, delay: 1, repeat: Infinity }}
      >
        <Leaf className="h-16 w-16 text-green-700" />
        <div className="text-xs font-semibold text-center mt-1 text-green-800">
          Organic
        </div>
      </motion.div>

      {/* Falling waste items */}
      {["🍎", "📰", "🥫", "🍌", "📦", "🥤"].map((item, index) => (
        <motion.div
          key={index}
          className="absolute text-2xl"
          initial={{ top: -20, left: `${(index + 1) * 14}%` }}
          animate={{
            top: "100%",
            rotate: 180,
          }}
          transition={{
            duration: 30,
            delay: index * .5,
            repeat: Infinity,
            ease: "linear",
          }}
        >
          {item}
        </motion.div>
      ))}

      {/* Swachh Bharat logo */}
      <motion.div
        className="absolute top-4 right-4 w-16 h-16 bg-orange-500 rounded-full flex items-center justify-center shadow-md"
        animate={{ rotate: [0, 10, -10, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      >
        <div className="text-white text-xs font-bold text-center">
          Swachh Bharat
        </div>
      </motion.div>
    </div>
  );
}
