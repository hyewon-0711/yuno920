"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";

export interface GrowthMetric {
  id: string;
  height: number | null;
  weight: number | null;
  sr_score: number | null;
  recorded_at: string;
  memo: string | null;
}

export function useGrowthMetrics(childId: string | undefined, months = 12) {
  const [physical, setPhysical] = useState<GrowthMetric[]>([]);
  const [learning, setLearning] = useState<GrowthMetric[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!childId) return;
    setLoading(true);
    const start = new Date();
    start.setMonth(start.getMonth() - months);
    const startStr = start.toISOString().split("T")[0];

    const { data } = await supabase
      .from("growth_metrics")
      .select("*")
      .eq("child_id", childId)
      .gte("recorded_at", startStr)
      .order("recorded_at");

    const list = (data || []) as GrowthMetric[];
    setPhysical(list.filter((r) => r.height != null || r.weight != null));
    setLearning(list.filter((r) => r.sr_score != null));
    setLoading(false);
  }, [childId, months]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  const addPhysical = async (height: number, weight: number, recordedAt: string, memo?: string) => {
    if (!childId) return;
    await supabase.from("growth_metrics").insert({
      child_id: childId,
      height,
      weight,
      recorded_at: recordedAt,
      memo: memo || null,
    });
    fetch();
  };

  const addLearning = async (srScore: number, recordedAt: string, memo?: string) => {
    if (!childId) return;
    await supabase.from("growth_metrics").insert({
      child_id: childId,
      sr_score: srScore,
      recorded_at: recordedAt,
      memo: memo || null,
    });
    fetch();
  };

  const deleteMetric = async (id: string) => {
    await supabase.from("growth_metrics").delete().eq("id", id);
    fetch();
  };

  return {
    physical,
    learning,
    loading,
    addPhysical,
    addLearning,
    deleteMetric,
    refetch: fetch,
  };
}
