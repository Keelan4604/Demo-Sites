"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { SwipeDeck } from "@/components/SwipeDeck";
import { BottomTabs } from "@/components/BottomTabs";
import { useSwipeStore } from "@/store/swipeStore";
import { motion } from "framer-motion";

export default function SwipePage() {
  const { items, setItems, isComplete } = useSwipeStore();
  const router = useRouter();

  useEffect(() => {
    fetch("/api/items")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) setItems(data);
        else console.error("No items or error:", data);
      })
      .catch((err) => console.error("Fetch failed:", err));
  }, [setItems]);

  useEffect(() => {
    if (isComplete && items.length > 0) {
      router.push("/results");
    }
  }, [isComplete, items.length, router]);

  if (items.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-screen">
        <motion.div
          className="text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div className="w-10 h-10 border-3 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-slate-500">Loading your ballot...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gradient-to-b from-slate-50 to-white overflow-hidden">
      {/* Header */}
      <header className="flex items-center justify-between px-5 py-3 shrink-0">
        <button
          onClick={() => router.push("/")}
          className="text-slate-400 hover:text-slate-600 transition-colors"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-sm font-semibold text-slate-700">Ballot Binge</h1>
        <div className="w-5" />
      </header>

      {/* Swipe deck */}
      <div className="flex-1 min-h-0">
        <SwipeDeck />
      </div>

      <BottomTabs />
    </div>
  );
}
