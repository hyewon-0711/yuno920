"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

interface ReadingToday {
  totalMinutes: number;
  bookCount: number;
  recentBook: string | null;
  goalMinutes: number;
  goalBooks: number;
}

export function useReadingToday(childId: string | undefined) {
  const [data, setData] = useState<ReadingToday>({
    totalMinutes: 0,
    bookCount: 0,
    recentBook: null,
    goalMinutes: 30,
    goalBooks: 1,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!childId) return;

    async function fetch() {
      const today = new Date().toISOString().split("T")[0];

      const { data: logs } = await supabase
        .from("reading_logs")
        .select("title, duration_minutes")
        .eq("child_id", childId)
        .eq("read_date", today)
        .order("created_at", { ascending: false });

      if (logs) {
        setData({
          totalMinutes: logs.reduce((sum, l) => sum + l.duration_minutes, 0),
          bookCount: logs.length,
          recentBook: logs[0]?.title ?? null,
          goalMinutes: 30,
          goalBooks: 1,
        });
      }
      setLoading(false);
    }

    fetch();
  }, [childId]);

  return { reading: data, loading };
}
