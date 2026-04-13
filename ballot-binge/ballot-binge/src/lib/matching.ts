// Matching / scoring logic - portable to React Native later

import type { SwipeItem, SwipeChoice, SwipeResults, TopicData } from "./types";

interface SwipeEntry {
  item: SwipeItem;
  choice: SwipeChoice;
}

export function computeResults(entries: SwipeEntry[]): SwipeResults {
  const yes: SwipeItem[] = [];
  const no: SwipeItem[] = [];
  const skipped: SwipeItem[] = [];

  for (const entry of entries) {
    if (entry.choice === "yes") yes.push(entry.item);
    else if (entry.choice === "no") no.push(entry.item);
    else skipped.push(entry.item);
  }

  return { total: entries.length, yes, no, skipped };
}

export function getTopTopics(entries: SwipeEntry[]): { topic: TopicData; count: number }[] {
  const topicMap = new Map<string, { topic: TopicData; count: number }>();

  for (const entry of entries) {
    if (entry.choice !== "yes") continue;
    const topics =
      entry.item.type === "candidate"
        ? entry.item.data.topics
        : entry.item.data.topics;

    for (const topic of topics) {
      const existing = topicMap.get(topic.id);
      if (existing) {
        existing.count++;
      } else {
        topicMap.set(topic.id, { topic, count: 1 });
      }
    }
  }

  return Array.from(topicMap.values()).sort((a, b) => b.count - a.count);
}
