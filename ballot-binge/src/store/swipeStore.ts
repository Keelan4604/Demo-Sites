"use client";

import { create } from "zustand";
import type { SwipeItem, SwipeChoice } from "@/lib/types";

interface SwipeEntry {
  item: SwipeItem;
  choice: SwipeChoice;
}

interface SwipeState {
  sessionId: string;
  items: SwipeItem[];
  currentIndex: number;
  choices: SwipeEntry[];
  isComplete: boolean;

  setItems: (items: SwipeItem[]) => void;
  recordSwipe: (choice: SwipeChoice) => void;
  reset: () => void;
}

function generateSessionId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

export const useSwipeStore = create<SwipeState>((set, get) => ({
  sessionId: generateSessionId(),
  items: [],
  currentIndex: 0,
  choices: [],
  isComplete: false,

  setItems: (items) => set({ items, currentIndex: 0, choices: [], isComplete: false }),

  recordSwipe: (choice) => {
    const state = get();
    const currentItem = state.items[state.currentIndex];
    if (!currentItem) return;

    const newChoices = [...state.choices, { item: currentItem, choice }];
    const nextIndex = state.currentIndex + 1;
    const isComplete = nextIndex >= state.items.length;

    set({
      choices: newChoices,
      currentIndex: nextIndex,
      isComplete,
    });

    // Fire and forget save to API
    fetch("/api/swipes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId: state.sessionId,
        itemType: currentItem.type,
        itemId: currentItem.data.id,
        choice,
      }),
    }).catch(() => {});
  },

  reset: () =>
    set({
      sessionId: generateSessionId(),
      currentIndex: 0,
      choices: [],
      isComplete: false,
    }),
}));
