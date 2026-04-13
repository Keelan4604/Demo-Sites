"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useSwipeStore } from "@/store/swipeStore";
import { BottomTabs } from "@/components/BottomTabs";

export default function LikedPage() {
  const { choices } = useSwipeStore();
  const router = useRouter();

  const liked = choices.filter((c) => c.choice === "yes");

  return (
    <div className="flex flex-col h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <header className="flex items-center justify-between px-5 py-3 shrink-0">
        <button
          onClick={() => router.push("/swipe")}
          className="text-slate-400 hover:text-slate-600 transition-colors"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-sm font-semibold text-slate-700">Your Picks</h1>
        <div className="w-5" />
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        {liked.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-6">
            <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
              </svg>
            </div>
            <p className="text-sm text-slate-500 mb-1">No picks yet</p>
            <p className="text-xs text-slate-400">Swipe right on candidates and measures you support</p>
          </div>
        ) : (
          <div className="space-y-3 mt-2">
            {liked.map((entry, i) => {
              const item = entry.item;
              const isCandidate = item.type === "candidate";
              return (
                <motion.div
                  key={item.data.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-center gap-3 p-3 rounded-xl bg-white shadow-sm border border-slate-100"
                >
                  {/* Thumbnail */}
                  {isCandidate && item.data.imageUrl ? (
                    <img
                      src={item.data.imageUrl}
                      alt={item.data.name}
                      className="w-12 h-12 rounded-lg object-cover object-center shrink-0"
                    />
                  ) : (
                    <div
                      className={`w-12 h-12 rounded-lg shrink-0 flex items-center justify-center text-xl ${
                        isCandidate
                          ? "bg-indigo-50"
                          : "bg-amber-50"
                      }`}
                    >
                      {isCandidate ? "👤" : getCategoryEmoji(item.type === "measure" ? item.data.category : undefined)}
                    </div>
                  )}

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-900 truncate">
                      {isCandidate ? item.data.name : item.data.title}
                    </p>
                    <p className="text-xs text-slate-500 truncate">
                      {isCandidate
                        ? `${item.data.office} · ${item.data.jurisdiction.name}`
                        : `${item.data.jurisdiction.name}${item.type === "measure" && item.data.measureCode ? ` · ${item.data.measureCode}` : ""}`}
                    </p>
                  </div>

                  {/* Type badge */}
                  <span
                    className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full shrink-0 ${
                      isCandidate
                        ? item.data.party === "Democratic"
                          ? "bg-blue-50 text-blue-600"
                          : item.data.party === "Republican"
                          ? "bg-red-50 text-red-600"
                          : "bg-purple-50 text-purple-600"
                        : "bg-amber-50 text-amber-700"
                    }`}
                  >
                    {isCandidate ? item.data.party?.[0] || "I" : "Measure"}
                  </span>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      <BottomTabs />
    </div>
  );
}

function getCategoryEmoji(category?: string): string {
  const emojis: Record<string, string> = {
    Housing: "🏠", Environment: "🌿", Education: "📚", "Public Safety": "🛡️",
    Technology: "💻", Immigration: "🌎", Transportation: "🚆", Healthcare: "🏥",
    Economy: "💼", Energy: "⚡", "Gun Policy": "🎯", Elections: "🗳️",
    "Civil Rights": "⚖️",
  };
  return emojis[category || ""] || "📋";
}
