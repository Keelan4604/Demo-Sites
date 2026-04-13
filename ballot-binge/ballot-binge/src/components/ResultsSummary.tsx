"use client";

import { motion } from "framer-motion";
import { useSwipeStore } from "@/store/swipeStore";
import { computeResults, getTopTopics } from "@/lib/matching";
import { useRouter } from "next/navigation";
import type { SwipeItem } from "@/lib/types";

export function ResultsSummary() {
  const { choices, items, reset } = useSwipeStore();
  const router = useRouter();

  const results = computeResults(choices);
  const topTopics = getTopTopics(choices);

  function handleStartOver() {
    reset();
    router.push("/");
  }

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.08 },
    },
  };

  const fadeUp = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <motion.div
        className="max-w-md mx-auto px-5 py-8"
        variants={container}
        initial="hidden"
        animate="show"
      >
        {/* Header */}
        <motion.div variants={fadeUp} className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-500 mb-4">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
              <path d="M9 12l2 2 4-4" />
              <circle cx="12" cy="12" r="10" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Your Ballot Summary</h1>
          <p className="text-slate-500">
            You reviewed {results.total} item{results.total !== 1 ? "s" : ""}
          </p>
        </motion.div>

        {/* Stats */}
        <motion.div variants={fadeUp} className="grid grid-cols-3 gap-3 mb-8">
          <div className="text-center p-4 rounded-2xl bg-emerald-50 border border-emerald-100">
            <p className="text-3xl font-bold text-emerald-600">{results.yes.length}</p>
            <p className="text-xs font-medium text-emerald-600 mt-1">For</p>
          </div>
          <div className="text-center p-4 rounded-2xl bg-rose-50 border border-rose-100">
            <p className="text-3xl font-bold text-rose-600">{results.no.length}</p>
            <p className="text-xs font-medium text-rose-600 mt-1">Against</p>
          </div>
          <div className="text-center p-4 rounded-2xl bg-slate-50 border border-slate-100">
            <p className="text-3xl font-bold text-slate-500">{results.skipped.length}</p>
            <p className="text-xs font-medium text-slate-500 mt-1">Skipped</p>
          </div>
        </motion.div>

        {/* Top Topics */}
        {topTopics.length > 0 && (
          <motion.div variants={fadeUp} className="mb-8">
            <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wider mb-3">
              Your top issues
            </h2>
            <div className="flex flex-wrap gap-2">
              {topTopics.slice(0, 5).map(({ topic }) => (
                <span
                  key={topic.id}
                  className="px-3 py-1.5 rounded-full bg-indigo-50 text-indigo-700 text-sm font-medium border border-indigo-100"
                >
                  {topic.icon && `${topic.icon} `}
                  {topic.name}
                </span>
              ))}
            </div>
          </motion.div>
        )}

        {/* Supported items */}
        {results.yes.length > 0 && (
          <motion.div variants={fadeUp} className="mb-6">
            <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wider mb-3">
              You supported
            </h2>
            <div className="space-y-2">
              {results.yes.map((item) => (
                <ResultCard key={item.data.id} item={item} variant="yes" />
              ))}
            </div>
          </motion.div>
        )}

        {/* Opposed items */}
        {results.no.length > 0 && (
          <motion.div variants={fadeUp} className="mb-6">
            <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wider mb-3">
              You opposed
            </h2>
            <div className="space-y-2">
              {results.no.map((item) => (
                <ResultCard key={item.data.id} item={item} variant="no" />
              ))}
            </div>
          </motion.div>
        )}

        {/* Skipped */}
        {results.skipped.length > 0 && (
          <motion.div variants={fadeUp} className="mb-8">
            <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wider mb-3">
              Skipped
            </h2>
            <div className="space-y-2">
              {results.skipped.map((item) => (
                <ResultCard key={item.data.id} item={item} variant="skip" />
              ))}
            </div>
          </motion.div>
        )}

        {/* Actions */}
        <motion.div variants={fadeUp} className="space-y-3 pt-4">
          <button
            onClick={handleStartOver}
            className="w-full py-3.5 rounded-xl bg-slate-900 text-white font-semibold text-sm hover:bg-slate-800 transition-colors"
          >
            Start over
          </button>
        </motion.div>
      </motion.div>
    </div>
  );
}

function ResultCard({
  item,
  variant,
}: {
  item: SwipeItem;
  variant: "yes" | "no" | "skip";
}) {
  const isCandidate = item.type === "candidate";
  const title = isCandidate ? item.data.name : item.data.title;
  const subtitle = isCandidate
    ? `${item.data.office} · ${item.data.jurisdiction.name}`
    : item.data.jurisdiction.name;
  const borderColor =
    variant === "yes"
      ? "border-l-emerald-400"
      : variant === "no"
      ? "border-l-rose-400"
      : "border-l-slate-300";

  return (
    <div className={`p-3 rounded-xl bg-white border border-slate-100 border-l-4 ${borderColor} shadow-sm`}>
      <div className="flex items-center gap-2 mb-0.5">
        <span
          className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full ${
            isCandidate
              ? "bg-indigo-50 text-indigo-600"
              : "bg-amber-50 text-amber-700"
          }`}
        >
          {isCandidate ? "Candidate" : "Measure"}
        </span>
      </div>
      <p className="text-sm font-semibold text-slate-900">{title}</p>
      <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>
    </div>
  );
}
