"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ResultsSummary } from "@/components/ResultsSummary";
import { useSwipeStore } from "@/store/swipeStore";

export default function ResultsPage() {
  const { choices } = useSwipeStore();
  const router = useRouter();

  useEffect(() => {
    if (choices.length === 0) {
      router.push("/");
    }
  }, [choices.length, router]);

  if (choices.length === 0) return null;

  return <ResultsSummary />;
}
