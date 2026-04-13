"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useUserStore } from "@/store/userStore";

const US_STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA",
  "KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ",
  "NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT",
  "VA","WA","WV","WI","WY","DC",
];

const PARTIES = ["Democratic", "Republican", "Independent", "Libertarian", "Green", "Other", "Prefer not to say"];

export default function LandingPage() {
  const router = useRouter();
  const { profile, setProfile, completeOnboarding } = useUserStore();
  const [step, setStep] = useState<"hero" | "info">("hero");

  function handleStart() {
    setStep("info");
  }

  function handleContinue() {
    completeOnboarding();
    // Save profile to API (fire and forget for analytics/monetization)
    fetch("/api/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(profile),
    }).catch(() => {});
    router.push("/swipe");
  }

  function handleSkip() {
    completeOnboarding();
    router.push("/swipe");
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 min-h-screen bg-gradient-to-b from-slate-50 via-white to-indigo-50/30">
      {step === "hero" ? (
        <motion.div
          className="max-w-md w-full text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Logo */}
          <motion.div
            className="mb-8"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
          >
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-indigo-500 via-violet-500 to-purple-600 shadow-xl shadow-indigo-200/50 mb-6">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 12l2 2 4-4" />
                <rect x="3" y="3" width="18" height="18" rx="4" />
              </svg>
            </div>
            <h1 className="text-4xl font-bold text-slate-900 tracking-tight">
              Ballot Binge
            </h1>
            <p className="text-lg text-slate-500 mt-2 font-medium">
              Know your ballot
            </p>
          </motion.div>

          <motion.p
            className="text-base text-slate-600 leading-relaxed mb-10 max-w-sm mx-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            Swipe through candidates and ballot measures to get educated on
            what&apos;s on your ballot. Quick, easy, and non-partisan.
          </motion.p>

          <motion.div
            className="space-y-3"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <button
              onClick={handleStart}
              className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-semibold text-base shadow-lg shadow-indigo-300/40 hover:shadow-xl hover:shadow-indigo-300/50 active:scale-[0.98] transition-all"
            >
              Get started
            </button>
          </motion.div>

          {/* How it works */}
          <motion.div
            className="mt-14 grid grid-cols-3 gap-4 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center mx-auto mb-2">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round">
                  <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                </svg>
              </div>
              <p className="text-xs font-medium text-slate-600">Read the card</p>
            </div>
            <div>
              <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center mx-auto mb-2">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </div>
              <p className="text-xs font-medium text-slate-600">Flip &amp; explore</p>
            </div>
            <div>
              <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center mx-auto mb-2">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round">
                  <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
              </div>
              <p className="text-xs font-medium text-slate-600">Stay informed</p>
            </div>
          </motion.div>
        </motion.div>
      ) : (
        /* ===== INFO STEP ===== */
        <motion.div
          className="max-w-md w-full"
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
        >
          <h2 className="text-2xl font-bold text-slate-900 mb-1">Tell us about you</h2>
          <p className="text-sm text-slate-500 mb-6">
            Help us personalize your experience. All fields are optional.
          </p>

          <div className="space-y-4">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
              <input
                type="text"
                value={profile.name}
                onChange={(e) => setProfile({ name: e.target.value })}
                placeholder="Your name"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent placeholder:text-slate-400"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
              <input
                type="email"
                value={profile.email}
                onChange={(e) => setProfile({ email: e.target.value })}
                placeholder="you@example.com"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent placeholder:text-slate-400"
              />
            </div>

            {/* Party */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Party preference</label>
              <select
                value={profile.party}
                onChange={(e) => setProfile({ party: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent appearance-none"
              >
                <option value="">Select...</option>
                {PARTIES.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>

            {/* City + State side by side */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">City</label>
                <input
                  type="text"
                  value={profile.city}
                  onChange={(e) => setProfile({ city: e.target.value })}
                  placeholder="Your city"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent placeholder:text-slate-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">State</label>
                <select
                  value={profile.state}
                  onChange={(e) => setProfile({ state: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent appearance-none"
                >
                  <option value="">Select...</option>
                  {US_STATES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="mt-8 space-y-3">
            <button
              onClick={handleContinue}
              className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-semibold text-base shadow-lg shadow-indigo-300/40 hover:shadow-xl active:scale-[0.98] transition-all"
            >
              Start exploring
            </button>
            <button
              onClick={handleSkip}
              className="w-full py-3 px-6 text-sm font-medium text-slate-500 hover:text-slate-700 transition-colors"
            >
              Skip for now
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
