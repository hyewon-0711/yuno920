"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";

export interface MonthlyReading {
  month: string;
  totalMinutes: number;
  bookCount: number;
}

export function useReadingGrowth(childId: string | undefined, months = 6) {
  const [data, setData] = useState<MonthlyReading[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!childId) return;
    setLoading(true);
    const start = new Date();
    start.setMonth(start.getMonth() - months);
    const startStr = start.toISOString().split("T")[0];

    const { data: logs } = await supabase
      .from("reading_logs")
      .select("read_date, duration_minutes")
      .eq("child_id", childId)
      .gte("read_date", startStr)
      .order("read_date");

    const byMonth: Record<string, { minutes: number; count: number }> = {};
    for (const row of logs || []) {
      const month = (row.read_date as string).slice(0, 7);
      if (!byMonth[month]) byMonth[month] = { minutes: 0, count: 0 };
      byMonth[month].minutes += row.duration_minutes || 0;
      byMonth[month].count += 1;
    }

    const result = Object.entries(byMonth)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, v]) => ({ month, totalMinutes: v.minutes, bookCount: v.count }));

    setData(result);
    setLoading(false);
  }, [childId, months]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { data, loading, refetch: fetch };
}
