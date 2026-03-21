"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { api } from "@/lib/api";

export interface HexagonScores {
  learning: number;
  physical: number;
  social: number;
  emotion: number;
  creativity: number;
  habit: number;
}

const LABELS: Record<keyof HexagonScores, string> = {
  learning: "학습",
  physical: "신체",
  social: "사회성",
  emotion: "감정",
  creativity: "창의성",
  habit: "습관",
};

export function useHexagon(childId: string | undefined) {
  const [scores, setScores] = useState<HexagonScores | null>(null);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!childId) return;
    setLoading(true);
    const { data } = await supabase
      .from("hexagon_scores")
      .select("*")
      .eq("child_id", childId)
      .order("calculated_at", { ascending: false })
      .limit(1)
      .single();

    if (data) {
      setScores({
        learning: data.learning,
        physical: data.physical,
        social: data.social,
        emotion: data.emotion,
        creativity: data.creativity,
        habit: data.habit,
      });
    } else {
      setScores(null);
    }
    setLoading(false);
  }, [childId]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  const calculateWithAI = async () => {
    if (!childId) return;
    setLoading(true);
    try {
      const result = await api.post<HexagonScores>("/api/ai/hexagon/calculate", { child_id: childId });
      setScores(result);
    } finally {
      setLoading(false);
      fetch();
    }
  };

  const saveManual = async (s: HexagonScores) => {
    if (!childId) return;
    await supabase.from("hexagon_scores").insert({
      child_id: childId,
      ...s,
    });
    fetch();
  };

  return { scores, loading, calculateWithAI, saveManual, refetch: fetch, LABELS };
}
