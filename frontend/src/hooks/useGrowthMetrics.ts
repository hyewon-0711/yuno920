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

function rowHasPhysical(r: GrowthMetric): boolean {
  return r.height != null || r.weight != null;
}

function rowHasLearning(r: GrowthMetric): boolean {
  return r.sr_score != null;
}

export function useGrowthMetrics(childId: string | undefined) {
  const [physical, setPhysical] = useState<GrowthMetric[]>([]);
  const [learning, setLearning] = useState<GrowthMetric[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const fetch = useCallback(async (opts?: { quiet?: boolean }) => {
    if (!childId) {
      if (!opts?.quiet) setLoading(false);
      return;
    }
    if (!opts?.quiet) {
      setLoading(true);
      setLoadError(null);
    }

    const { data, error } = await supabase
      .from("growth_metrics")
      .select("*")
      .eq("child_id", childId)
      .order("recorded_at", { ascending: true });

    if (error) {
      console.error("growth_metrics fetch:", error.message);
      setLoadError(error.message);
      if (!opts?.quiet) setLoading(false);
      return;
    }

    setLoadError(null);
    const list = (data || []) as GrowthMetric[];
    setPhysical(list.filter(rowHasPhysical));
    setLearning(list.filter(rowHasLearning));
    if (!opts?.quiet) setLoading(false);
  }, [childId]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  const addPhysical = async (height: number, weight: number, recordedAt: string, memo?: string) => {
    if (!childId) {
      throw new Error("아이 정보가 아직 없습니다. 페이지를 새로고침한 뒤 다시 시도해주세요.");
    }
    const { data: insertedRows, error } = await supabase
      .from("growth_metrics")
      .insert({
        child_id: childId,
        height,
        weight,
        recorded_at: recordedAt,
        memo: memo || null,
      })
      .select("*");
    if (error) throw new Error(error.message);
    await fetch({ quiet: true });
    const row = (insertedRows?.[0] ?? null) as GrowthMetric | null;
    if (row && rowHasPhysical(row)) {
      setPhysical((prev) =>
        prev.some((x) => x.id === row.id) ? prev : [...prev, row].sort((a, b) => a.recorded_at.localeCompare(b.recorded_at)),
      );
    }
  };

  const addLearning = async (srScore: number, recordedAt: string, memo?: string) => {
    if (!childId) {
      throw new Error("아이 정보가 아직 없습니다. 페이지를 새로고침한 뒤 다시 시도해주세요.");
    }
    const { data: insertedRows, error } = await supabase
      .from("growth_metrics")
      .insert({
        child_id: childId,
        sr_score: srScore,
        recorded_at: recordedAt,
        memo: memo || null,
      })
      .select("*");
    if (error) throw new Error(error.message);
    await fetch({ quiet: true });
    const row = (insertedRows?.[0] ?? null) as GrowthMetric | null;
    if (row && rowHasLearning(row)) {
      setLearning((prev) =>
        prev.some((x) => x.id === row.id) ? prev : [...prev, row].sort((a, b) => a.recorded_at.localeCompare(b.recorded_at)),
      );
    }
  };

  const deleteMetric = async (id: string) => {
    const { error } = await supabase.from("growth_metrics").delete().eq("id", id);
    if (error) throw new Error(error.message);
    await fetch({ quiet: true });
  };

  return {
    physical,
    learning,
    loading,
    loadError,
    addPhysical,
    addLearning,
    deleteMetric,
    refetch: fetch,
  };
}
