"use client";

import { motion } from "framer-motion";
import type { SwipeChoice } from "@/lib/types";

interface ActionButtonsProps {
  onAction: (choice: SwipeChoice) => void;
}

export function ActionButtons({ onAction }: ActionButtonsProps) {
  return (
    <div className="flex items-center justify-center gap-5 py-5 px-4">
      {/* No / Against */}
      <motion.button
        whileTap={{ scale: 0.9 }}
        whileHover={{ scale: 1.05 }}
        onClick={() => onAction("no")}
        className="w-16 h-16 rounded-full bg-white shadow-lg border-2 border-rose-200 flex items-center justify-center text-rose-500 hover:border-rose-400 hover:text-rose-600 transition-colors"
        aria-label="Against"
      >
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <path d="M18 6L6 18M6 6l12 12" />
        </svg>
      </motion.button>

      {/* Skip */}
      <motion.button
        whileTap={{ scale: 0.9 }}
        whileHover={{ scale: 1.05 }}
        onClick={() => onAction("skip")}
        className="w-12 h-12 rounded-full bg-white shadow-md border-2 border-slate-200 flex items-center justify-center text-slate-400 hover:border-slate-300 hover:text-slate-500 transition-colors"
        aria-label="Skip"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <path d="M5 12h14M12 5l7 7-7 7" />
        </svg>
      </motion.button>

      {/* Yes / For */}
      <motion.button
        whileTap={{ scale: 0.9 }}
        whileHover={{ scale: 1.05 }}
        onClick={() => onAction("yes")}
        className="w-16 h-16 rounded-full bg-white shadow-lg border-2 border-emerald-200 flex items-center justify-center text-emerald-500 hover:border-emerald-400 hover:text-emerald-600 transition-colors"
        aria-label="For"
      >
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <path d="M20 6L9 17l-5-5" />
        </svg>
      </motion.button>
    </div>
  );
}
