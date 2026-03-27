"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";

export interface WeeklyTimetableEntry {
  id: string;
  child_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  title: string;
  category: string;
  notes: string | null;
  color: string | null;
  sort_order: number;
}

export const WEEKDAY_LABELS = ["월", "화", "수", "목", "금", "토", "일"] as const;

function toHhMm(t: string): string {
  const s = t?.slice(0, 5) || t;
  return s.length >= 5 ? s : t;
}

export function useWeeklyTimetable(childId: string | undefined) {
  const [entries, setEntries] = useState<WeeklyTimetableEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const fetch = useCallback(
    async (opts?: { quiet?: boolean }) => {
      if (!childId) {
        if (!opts?.quiet) setLoading(false);
        setEntries([]);
        return;
      }
      if (!opts?.quiet) {
        setLoading(true);
        setLoadError(null);
      }
      const { data, error } = await supabase
        .from("weekly_timetable")
        .select("*")
        .eq("child_id", childId)
        .order("day_of_week", { ascending: true })
        .order("start_time", { ascending: true })
        .order("sort_order", { ascending: true });

      if (error) {
        console.error("weekly_timetable fetch:", error.message);
        setLoadError(error.message);
        if (!opts?.quiet) setLoading(false);
        return;
      }
      setLoadError(null);
      setEntries((data || []) as WeeklyTimetableEntry[]);
      if (!opts?.quiet) setLoading(false);
    },
    [childId],
  );

  useEffect(() => {
    void fetch();
  }, [fetch]);

  const addEntry = async (input: {
    day_of_week: number;
    start_time: string;
    end_time: string;
    title: string;
    category?: string;
    notes?: string | null;
    color?: string | null;
  }) => {
    if (!childId) throw new Error("아이 정보가 없습니다.");
    const { error } = await supabase
      .from("weekly_timetable")
      .insert({
        child_id: childId,
        day_of_week: input.day_of_week,
        start_time: normalizeTime(input.start_time),
        end_time: normalizeTime(input.end_time),
        title: input.title.trim(),
        category: input.category || "other",
        notes: input.notes?.trim() || null,
        color: input.color?.trim() || null,
        sort_order: 0,
      });
    if (error) throw new Error(error.message);
    await fetch({ quiet: true });
  };

  const updateEntry = async (
    id: string,
    patch: Partial<Pick<WeeklyTimetableEntry, "day_of_week" | "start_time" | "end_time" | "title" | "category" | "notes" | "color">>,
  ) => {
    const row: Record<string, unknown> = {};
    if (patch.day_of_week !== undefined) row.day_of_week = patch.day_of_week;
    if (patch.start_time !== undefined) row.start_time = normalizeTime(patch.start_time);
    if (patch.end_time !== undefined) row.end_time = normalizeTime(patch.end_time);
    if (patch.title !== undefined) row.title = patch.title.trim();
    if (patch.category !== undefined) row.category = patch.category;
    if (patch.notes !== undefined) row.notes = patch.notes?.trim() || null;
    if (patch.color !== undefined) row.color = patch.color?.trim() || null;
    const { error } = await supabase.from("weekly_timetable").update(row).eq("id", id);
    if (error) throw new Error(error.message);
    await fetch({ quiet: true });
  };

  const deleteEntry = async (id: string) => {
    const { error } = await supabase.from("weekly_timetable").delete().eq("id", id);
    if (error) throw new Error(error.message);
    await fetch({ quiet: true });
  };

  return {
    entries,
    loading,
    loadError,
    addEntry,
    updateEntry,
    deleteEntry,
    refetch: fetch,
    toHhMm,
  };
}

/** HTML time / "09:00" → "09:00:00" */
function normalizeTime(t: string): string {
  const x = t.trim();
  if (x.length === 5 && x[2] === ":") return `${x}:00`;
  return x;
}
