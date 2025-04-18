"use client";

import React from "react";
import { motion } from "framer-motion";

interface ChatButtonProps {
  onClick: () => void;
  isOpen: boolean;
}

export default function ChatButton({ onClick, isOpen }: ChatButtonProps) {
  if (isOpen) return null;

  return (
    <motion.button
      onClick={onClick}
      className="flex fixed left-4 bottom-20 z-40 justify-center items-center px-4 py-2 bg-white rounded-full border border-gray-100 shadow-lg hover:bg-gray-50"
      aria-label="Open chat"
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 100, opacity: 0 }}
      transition={{
        type: "spring",
        stiffness: 300,
        damping: 25,
      }}
      whileHover={{
        scale: 1.05,
        boxShadow: "0 10px 25px rgba(0, 0, 0, 0.08)",
      }}
      whileTap={{ scale: 0.95 }}
    >
      <div className="flex items-center space-x-2">
        <svg
          className="h-5 w-5 text-[#4dd783]"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
          />
        </svg>
        <span className="text-sm font-medium text-gray-700">
          Ask 420 Assistant
        </span>
      </div>
    </motion.button>
  );
}
