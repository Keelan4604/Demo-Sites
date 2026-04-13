"use client";

import { motion } from "framer-motion";
import type { SwipeItem, CandidateData, BallotMeasureData } from "@/lib/types";

interface DetailModalProps {
  item: SwipeItem;
  onClose: () => void;
}

export function DetailModal({ item, onClose }: DetailModalProps) {
  return (
    <>
      <motion.div
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />
      <motion.div
        className="fixed inset-x-0 bottom-0 z-50 max-h-[85vh] overflow-y-auto rounded-t-3xl bg-white shadow-2xl"
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
      >
        <div className="sticky top-0 z-10 bg-white/90 backdrop-blur-md pt-3 pb-2 flex justify-center rounded-t-3xl">
          <div className="w-10 h-1 rounded-full bg-slate-300" />
        </div>
        <div className="px-5 pb-8">
          {item.type === "candidate" ? (
            <CandidateDetail data={item.data} />
          ) : (
            <MeasureDetail data={item.data} />
          )}
          <button
            onClick={onClose}
            className="w-full py-3 rounded-xl bg-slate-900 text-white font-semibold text-sm hover:bg-slate-800 transition-colors mt-4"
          >
            Back to cards
          </button>
        </div>
      </motion.div>
    </>
  );
}

function CandidateDetail({ data }: { data: CandidateData }) {
  return (
    <>
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xs font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-600">
          Candidate
        </span>
        {data.party && <span className="text-sm font-medium text-slate-400">{data.party}</span>}
      </div>
      <h2 className="text-2xl font-bold text-slate-900 mb-1">{data.name}</h2>
      <p className="text-sm text-slate-500 mb-4">
        {data.office} &middot; {data.jurisdiction.name}
      </p>
      <div className="mb-5">
        <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wider mb-2">Summary</h3>
        <p className="text-base text-slate-700 leading-relaxed">{data.longSummary || data.shortSummary}</p>
      </div>
      {data.stances.length > 0 && (
        <div className="mb-5">
          <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wider mb-2">Key Positions</h3>
          <div className="space-y-3">
            {data.stances.map((stance) => (
              <div key={stance.id} className="p-3 rounded-xl bg-slate-50">
                <p className="text-xs font-semibold text-indigo-600 mb-1">{stance.topic}</p>
                <p className="text-sm font-medium text-slate-800 mb-0.5">{stance.position}</p>
                <p className="text-sm text-slate-600">{stance.summary}</p>
              </div>
            ))}
          </div>
        </div>
      )}
      {data.topics.length > 0 && (
        <div className="mb-5">
          <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wider mb-2">Topics</h3>
          <div className="flex flex-wrap gap-2">
            {data.topics.map((topic) => (
              <span key={topic.id} className="text-xs px-3 py-1.5 rounded-full bg-slate-100 text-slate-600 font-medium">
                {topic.icon && `${topic.icon} `}{topic.name}
              </span>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

function MeasureDetail({ data }: { data: BallotMeasureData }) {
  return (
    <>
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xs font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full bg-amber-50 text-amber-700">
          Ballot Measure
        </span>
        {data.measureCode && <span className="text-sm font-medium text-slate-400">{data.measureCode}</span>}
      </div>
      <h2 className="text-2xl font-bold text-slate-900 mb-1">{data.title}</h2>
      <p className="text-sm text-slate-500 mb-4">
        {data.jurisdiction.name}
        {data.category && ` · ${data.category}`}
        {data.electionDate && ` · ${data.electionDate}`}
      </p>
      <div className="mb-5">
        <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wider mb-2">Summary</h3>
        <p className="text-base text-slate-700 leading-relaxed">{data.longSummary || data.shortSummary}</p>
      </div>
      {(data.yesMeans || data.noMeans) && (
        <div className="mb-5 space-y-3">
          <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wider">What your vote means</h3>
          {data.yesMeans && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-100">
              <p className="text-xs font-semibold text-emerald-700 mb-1">A &ldquo;Yes&rdquo; vote means:</p>
              <p className="text-sm text-emerald-800">{data.yesMeans}</p>
            </div>
          )}
          {data.noMeans && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-100">
              <p className="text-xs font-semibold text-rose-700 mb-1">A &ldquo;No&rdquo; vote means:</p>
              <p className="text-sm text-rose-800">{data.noMeans}</p>
            </div>
          )}
        </div>
      )}
      {data.proArguments && data.proArguments.length > 0 && (
        <div className="mb-5">
          <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wider mb-2">Arguments</h3>
          <div className="grid gap-3">
            <div className="p-3 rounded-xl bg-slate-50">
              <p className="text-xs font-semibold text-emerald-600 mb-1.5">In favor</p>
              <ul className="space-y-1.5">
                {data.proArguments.map((arg, i) => (
                  <li key={i} className="text-sm text-slate-700 flex items-start gap-2">
                    <span className="shrink-0 mt-1 w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    {arg}
                  </li>
                ))}
              </ul>
            </div>
            {data.conArguments && data.conArguments.length > 0 && (
              <div className="p-3 rounded-xl bg-slate-50">
                <p className="text-xs font-semibold text-rose-600 mb-1.5">Against</p>
                <ul className="space-y-1.5">
                  {data.conArguments.map((arg, i) => (
                    <li key={i} className="text-sm text-slate-700 flex items-start gap-2">
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
        <div className="mb-5">
          <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wider mb-2">Topics</h3>
          <div className="flex flex-wrap gap-2">
            {data.topics.map((topic) => (
              <span key={topic.id} className="text-xs px-3 py-1.5 rounded-full bg-slate-100 text-slate-600 font-medium">
                {topic.icon && `${topic.icon} `}{topic.name}
              </span>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
