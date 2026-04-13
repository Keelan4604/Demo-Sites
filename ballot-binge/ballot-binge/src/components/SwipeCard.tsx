"use client";

import { motion, useMotionValue, useTransform, type PanInfo } from "framer-motion";
import type { SwipeItem, CandidateData, BallotMeasureData } from "@/lib/types";
import { useState } from "react";

interface SwipeCardProps {
  item: SwipeItem;
  onSwipe: (direction: "left" | "right") => void;
  isTop: boolean;
}

const SWIPE_THRESHOLD = 100;

function getCategoryGradient(category?: string): string {
  const gradients: Record<string, string> = {
    Housing: "from-sky-400 to-blue-600",
    Environment: "from-emerald-400 to-green-600",
    Education: "from-violet-400 to-purple-600",
    "Public Safety": "from-rose-400 to-red-600",
    Technology: "from-cyan-400 to-teal-600",
    Immigration: "from-orange-400 to-amber-600",
    Transportation: "from-indigo-400 to-blue-600",
    Healthcare: "from-pink-400 to-rose-600",
    Economy: "from-yellow-400 to-amber-600",
    Energy: "from-lime-400 to-green-600",
    "Gun Policy": "from-slate-400 to-gray-600",
    "National Security": "from-blue-400 to-indigo-600",
  };
  return gradients[category || ""] || "from-slate-400 to-gray-600";
}

function getCategoryEmoji(category?: string): string {
  const emojis: Record<string, string> = {
    Housing: "🏠",
    Environment: "🌿",
    Education: "📚",
    "Public Safety": "🛡️",
    Technology: "💻",
    Immigration: "🌎",
    Transportation: "🚆",
    Healthcare: "🏥",
    Economy: "💼",
    Energy: "⚡",
    "Gun Policy": "🎯",
    "National Security": "🦅",
  };
  return emojis[category || ""] || "📋";
}

export function SwipeCard({ item, onSwipe, isTop }: SwipeCardProps) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-300, 0, 300], [-15, 0, 15]);
  const opacity = useTransform(x, [-300, -100, 0, 100, 300], [0.5, 1, 1, 1, 0.5]);
  const yesOpacity = useTransform(x, [0, 80], [0, 1]);
  const noOpacity = useTransform(x, [-80, 0], [1, 0]);
  const [isDragging, setIsDragging] = useState(false);
  const [isFlipped, setIsFlipped] = useState(false);

  const isCandidate = item.type === "candidate";

  function handleDragEnd(_: unknown, info: PanInfo) {
    setIsDragging(false);
    if (info.offset.x > SWIPE_THRESHOLD) {
      onSwipe("right");
    } else if (info.offset.x < -SWIPE_THRESHOLD) {
      onSwipe("left");
    }
  }

  function handleTap() {
    if (!isDragging) {
      setIsFlipped(!isFlipped);
    }
  }

  const title = isCandidate ? item.data.name : item.data.title;
  const subtitle = isCandidate
    ? `${item.data.office} · ${item.data.jurisdiction.name}`
    : `${item.data.jurisdiction.name}${item.type === "measure" && item.data.category ? ` · ${item.data.category}` : ""}`;
  const badge = isCandidate ? item.data.party : item.type === "measure" ? item.data.measureCode : undefined;
  const topics = item.data.topics.slice(0, 3);

  return (
    <motion.div
      className={`absolute inset-0 ${isTop ? "z-10" : "z-0"}`}
      style={{ x, rotate, opacity, touchAction: "none" }}
      drag={isTop ? "x" : false}
      dragConstraints={{ left: 0, right: 0 }}
      dragDirectionLock
      dragElastic={0.8}
      onDirectionLock={(axis) => {
        if (axis === "x") setIsDragging(true);
      }}
      onDragStart={() => setIsDragging(true)}
      onDragEnd={handleDragEnd}
      whileTap={{ cursor: "grabbing" }}
      initial={isTop ? { scale: 1 } : { scale: 0.95, y: 12 }}
      animate={isTop ? { scale: 1, y: 0 } : { scale: 0.95, y: 12 }}
      exit={{
        x: x.get() > 0 ? 400 : -400,
        opacity: 0,
        transition: { duration: 0.3 },
      }}
    >
      {/* Swipe overlays */}
      <motion.div
        className="absolute inset-0 z-20 flex items-center justify-center rounded-2xl bg-emerald-500/20 pointer-events-none"
        style={{ opacity: yesOpacity }}
      >
        <div className="rounded-xl border-4 border-emerald-500 px-6 py-3 rotate-[-12deg]">
          <span className="text-4xl font-bold text-emerald-500">YES</span>
        </div>
      </motion.div>
      <motion.div
        className="absolute inset-0 z-20 flex items-center justify-center rounded-2xl bg-rose-500/20 pointer-events-none"
        style={{ opacity: noOpacity }}
      >
        <div className="rounded-xl border-4 border-rose-500 px-6 py-3 rotate-[12deg]">
          <span className="text-4xl font-bold text-rose-500">NOPE</span>
        </div>
      </motion.div>

      {/* 3D flip container */}
      <div
        className="h-full w-full select-none cursor-grab active:cursor-grabbing"
        style={{ perspective: 1200 }}
        onClick={handleTap}
      >
        <motion.div
          className="h-full w-full relative"
          style={{ transformStyle: "preserve-3d" }}
          animate={{ rotateY: isFlipped ? 180 : 0 }}
          transition={{ duration: 0.5, type: "spring", stiffness: 260, damping: 30 }}
        >
          {/* ===== FRONT FACE ===== */}
          <div
            className="absolute inset-0 rounded-2xl bg-white shadow-xl border border-slate-100 overflow-hidden flex flex-col"
            style={{ backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden" }}
          >
            {/* Image / Banner */}
            {isCandidate && item.data.imageUrl ? (
              <div className="relative shrink-0 bg-slate-200">
                <img
                  src={item.data.imageUrl}
                  alt={item.data.name}
                  className="w-full"
                  loading="eager"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                <div className="absolute bottom-3 left-4">
                  <span
                    className={`text-xs font-bold uppercase px-2.5 py-1 rounded-full ${
                      item.data.party === "Democratic"
                        ? "bg-blue-600/90 text-white"
                        : item.data.party === "Republican"
                        ? "bg-red-600/90 text-white"
                        : "bg-purple-600/90 text-white"
                    }`}
                  >
                    {item.data.party || "Independent"}
                  </span>
                </div>
              </div>
            ) : isCandidate ? (
              <div className="h-2 w-full bg-gradient-to-r from-indigo-500 to-violet-500 shrink-0" />
            ) : (
              <div
                className={`relative h-32 shrink-0 bg-gradient-to-br ${getCategoryGradient(
                  item.data.category
                )} flex items-center justify-center`}
              >
                <span className="text-6xl opacity-90">{getCategoryEmoji(item.data.category)}</span>
                {item.type === "measure" && item.data.measureCode && (
                  <span className="absolute top-3 right-3 text-xs font-bold text-white/90 bg-white/20 backdrop-blur-sm px-2.5 py-1 rounded-full">
                    {item.data.measureCode}
                  </span>
                )}
              </div>
            )}

            <div className="flex-1 flex flex-col min-h-0 px-5 pt-3 pb-3">
              <h2 className="text-xl font-bold text-slate-900 leading-tight">{title}</h2>
              <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>

              <p className="text-sm text-slate-700 leading-relaxed mt-2 line-clamp-3">
                {item.data.shortSummary}
              </p>

              {/* Quick stances or yes/no for measures */}
              {item.type === "candidate" && item.data.stances.length > 0 && (
                <div className="mt-2 space-y-1">
                  {item.data.stances.slice(0, 2).map((s) => (
                    <div key={s.id} className="flex items-start gap-1.5">
                      <span className="shrink-0 mt-1.5 w-1.5 h-1.5 rounded-full bg-indigo-400" />
                      <p className="text-xs text-slate-600">
                        <span className="font-semibold text-slate-700">{s.topic}:</span> {s.position}
                      </p>
                    </div>
                  ))}
                </div>
              )}
              {item.type === "measure" && (item.data.yesMeans || item.data.noMeans) && (
                <div className="mt-2 space-y-1.5">
                  {item.data.yesMeans && (
                    <div className="flex items-start gap-1.5">
                      <span className="shrink-0 mt-0.5 w-4 h-4 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-[10px] font-bold">Y</span>
                      <p className="text-xs text-slate-600 line-clamp-2">{item.data.yesMeans}</p>
                    </div>
                  )}
                  {item.data.noMeans && (
                    <div className="flex items-start gap-1.5">
                      <span className="shrink-0 mt-0.5 w-4 h-4 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center text-[10px] font-bold">N</span>
                      <p className="text-xs text-slate-600 line-clamp-2">{item.data.noMeans}</p>
                    </div>
                  )}
                </div>
              )}

              <div className="mt-auto" />

              {topics.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {topics.map((t) => (
                    <span
                      key={t.id}
                      className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 font-medium"
                    >
                      {t.icon && `${t.icon} `}
                      {t.name}
                    </span>
                  ))}
                </div>
              )}
              <p className="text-[11px] text-slate-400 text-center mt-2">Tap to flip</p>
            </div>
          </div>

          {/* ===== BACK FACE ===== */}
          <div
            className="absolute inset-0 rounded-2xl bg-white shadow-xl border border-slate-100 overflow-hidden flex flex-col"
            style={{
              backfaceVisibility: "hidden",
              WebkitBackfaceVisibility: "hidden",
              transform: "rotateY(180deg)",
            }}
          >
            <div
              className={`h-2 w-full shrink-0 bg-gradient-to-r ${
                isCandidate ? "from-indigo-500 to-violet-500" : "from-amber-400 to-orange-500"
              }`}
            />

            <div
              className="flex-1 overflow-y-auto px-5 pt-4 pb-3"
            >
              {/* Back header */}
              <div className="flex items-center gap-2 mb-2">
                <span
                  className={`text-xs font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full ${
                    isCandidate ? "bg-indigo-50 text-indigo-600" : "bg-amber-50 text-amber-700"
                  }`}
                >
                  {isCandidate ? "Candidate" : "Measure"}
                </span>
                {badge && <span className="text-xs font-medium text-slate-400">{badge}</span>}
              </div>
              <h2 className="text-lg font-bold text-slate-900 mb-0.5">{title}</h2>
              <p className="text-xs text-slate-500 mb-3">{subtitle}</p>

              {item.type === "candidate" ? (
                <CandidateBack data={item.data} />
              ) : (
                <MeasureBack data={item.data} />
              )}

            </div>

            <div className="px-5 pb-3 pt-1 text-center shrink-0 border-t border-slate-100">
              <span className="text-[11px] text-slate-400">Tap anywhere to flip back</span>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}

/* ---------- Back-of-card sub-components ---------- */

function CandidateBack({ data }: { data: CandidateData }) {
  const stances = data.stances;
  return (
    <>
      <div className="mb-3">
        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">About</h3>
        <p className="text-sm text-slate-700 leading-relaxed">
          {data.longSummary || data.shortSummary}
        </p>
      </div>

      {stances.length > 0 && (
        <div className="mb-3">
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
            Key Positions
          </h3>
          <div className="space-y-2">
            {stances.map((s) => (
              <div key={s.id} className="p-2.5 rounded-lg bg-slate-50">
                <p className="text-[11px] font-semibold text-indigo-600 mb-0.5">{s.topic}</p>
                <p className="text-xs font-medium text-slate-800">{s.position}</p>
                <p className="text-xs text-slate-600 mt-0.5">{s.summary}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {data.topics.length > 0 && (
        <div className="mb-3">
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Topics</h3>
          <div className="flex flex-wrap gap-1.5">
            {data.topics.map((t) => (
              <span key={t.id} className="text-[11px] px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 font-medium">
                {t.icon && `${t.icon} `}{t.name}
              </span>
            ))}
          </div>
        </div>
      )}

      {data.websiteUrl && (
        <a
          href={data.websiteUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="block w-full py-2 mt-1 text-sm font-medium text-center text-white bg-slate-800 rounded-xl hover:bg-slate-700 transition-colors"
        >
          Visit website
        </a>
      )}
    </>
  );
}

function MeasureBack({ data }: { data: BallotMeasureData }) {
  return (
    <>
      <div className="mb-3">
        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Full Summary</h3>
        <p className="text-sm text-slate-700 leading-relaxed">
          {data.longSummary || data.shortSummary}
        </p>
      </div>

      {(data.yesMeans || data.noMeans) && (
        <div className="mb-3 space-y-2">
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">What your vote means</h3>
          {data.yesMeans && (
            <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-100">
              <p className="text-[11px] font-semibold text-emerald-700 mb-0.5">A &ldquo;Yes&rdquo; vote means:</p>
              <p className="text-xs text-emerald-800">{data.yesMeans}</p>
            </div>
          )}
          {data.noMeans && (
            <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-100">
              <p className="text-[11px] font-semibold text-rose-700 mb-0.5">A &ldquo;No&rdquo; vote means:</p>
              <p className="text-xs text-rose-800">{data.noMeans}</p>
            </div>
          )}
        </div>
      )}

      {data.proArguments && data.proArguments.length > 0 && (
        <div className="mb-3">
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Arguments</h3>
          <div className="space-y-2">
            <div className="p-2.5 rounded-lg bg-slate-50">
              <p className="text-[11px] font-semibold text-emerald-600 mb-1">In favor</p>
              <ul className="space-y-1">
                {data.proArguments.map((arg, i) => (
                  <li key={i} className="text-xs text-slate-700 flex items-start gap-1.5">
                    <span className="shrink-0 mt-1 w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    {arg}
                  </li>
                ))}
              </ul>
            </div>
            {data.conArguments && data.conArguments.length > 0 && (
              <div className="p-2.5 rounded-lg bg-slate-50">
                <p className="text-[11px] font-semibold text-rose-600 mb-1">Against</p>
                <ul className="space-y-1">
                  {data.conArguments.map((arg, i) => (
                    <li key={i} className="text-xs text-slate-700 flex items-start gap-1.5">
                      <span className="shrink-0 mt-1 w-1.5 h-1.5 rounded-full bg-rose-400" />
                      {arg}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {data.topics.length > 0 && (
        <div className="mb-3">
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Topics</h3>
          <div className="flex flex-wrap gap-1.5">
            {data.topics.map((t) => (
              <span key={t.id} className="text-[11px] px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 font-medium">
                {t.icon && `${t.icon} `}{t.name}
              </span>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
