"use client";

import { AnimatePresence } from "framer-motion";
import { SwipeCard } from "./SwipeCard";
import { ActionButtons } from "./ActionButtons";
import { useSwipeStore } from "@/store/swipeStore";
import type { SwipeChoice } from "@/lib/types";

export function SwipeDeck() {
  const { items, currentIndex, isComplete, recordSwipe } = useSwipeStore();

  const currentItem = items[currentIndex];
  const nextItem = items[currentIndex + 1];

  function handleSwipe(direction: "left" | "right") {
    const choice: SwipeChoice = direction === "right" ? "yes" : "no";
    recordSwipe(choice);
  }

  function handleAction(choice: SwipeChoice) {
    recordSwipe(choice);
  }

  if (isComplete || !currentItem) {
    return null;
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 relative px-4 py-4 min-h-0 overflow-hidden">
        <div className="relative w-full h-full max-w-md mx-auto" style={{ maxHeight: "75vh", touchAction: "none" }}>
          <AnimatePresence mode="popLayout">
            {nextItem && (
              <SwipeCard
                key={`card-${currentIndex + 1}`}
                item={nextItem}
                onSwipe={() => {}}
                isTop={false}
              />
            )}
            <SwipeCard
              key={`card-${currentIndex}`}
              item={currentItem}
              onSwipe={handleSwipe}
              isTop={true}
            />
          </AnimatePresence>
        </div>
      </div>

      <ActionButtons onAction={handleAction} />
    </div>
  );
}
