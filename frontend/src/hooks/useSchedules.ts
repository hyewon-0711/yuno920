"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";

export interface Schedule {
  id: string;
  child_id: string;
  title: string;
  location: string | null;
  start_time: string;
  end_time: string | null;
  repeat_type: string;
}

function getToday() {
  const d = new Date();
  return d.toISOString().split("T")[0];
}

function getTomorrow() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split("T")[0];
}

export function useSchedules(childId: string | undefined) {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSchedules = useCallback(async () => {
    if (!childId) return;
    setLoading(true);

    const today = getToday();
    const tomorrow = getTomorrow();

    const { data, error } = await supabase
      .from("schedules")
      .select("*")
      .eq("child_id", childId)
      .gte("start_time", `${today}T00:00:00`)
      .lt("start_time", `${tomorrow}T00:00:00`)
      .order("start_time", { ascending: true });

    if (!error && data) setSchedules(data as Schedule[]);
    setLoading(false);
  }, [childId]);

  useEffect(() => {
    fetchSchedules();
  }, [fetchSchedules]);

  const addSchedule = async (schedule: { title: string; start_time: string; repeat_type: string; location?: string; end_time?: string }) => {
    if (!childId) return;
    const { error } = await supabase.from("schedules").insert({
      ...schedule,
      child_id: childId,
    });
    if (!error) await fetchSchedules();
    return error;
  };

  const deleteSchedule = async (id: string) => {
    const { error } = await supabase.from("schedules").delete().eq("id", id);
    if (!error) await fetchSchedules();
    return error;
  };

  return { schedules, loading, addSchedule, deleteSchedule, refetch: fetchSchedules };
}
