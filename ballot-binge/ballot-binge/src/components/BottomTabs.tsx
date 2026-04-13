"use client";

import { usePathname, useRouter } from "next/navigation";

const tabs = [
  {
    label: "Swipe",
    path: "/swipe",
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? "#6366f1" : "#94a3b8"} strokeWidth="2" strokeLinecap="round">
        <rect x="3" y="3" width="18" height="18" rx="4" />
        <path d="M9 12l2 2 4-4" />
      </svg>
    ),
  },
  {
    label: "Liked",
    path: "/liked",
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? "#6366f1" : "none"} stroke={active ? "#6366f1" : "#94a3b8"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
      </svg>
    ),
  },
];

export function BottomTabs() {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <nav className="shrink-0 flex items-center justify-around border-t border-slate-100 bg-white/90 backdrop-blur-md px-4 py-2 safe-bottom">
      {tabs.map((tab) => {
        const active = pathname === tab.path;
        return (
          <button
            key={tab.path}
            onClick={() => router.push(tab.path)}
            className="flex flex-col items-center gap-0.5 py-1 px-6"
          >
            {tab.icon(active)}
            <span
              className={`text-[11px] font-medium ${
                active ? "text-indigo-600" : "text-slate-400"
              }`}
            >
              {tab.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
