"use client";

import { useEffect, useState } from "react";
import { useChild } from "@/hooks/useChild";
import { postWithAuth } from "@/lib/api";
import styles from "./DailySummarySection.module.css";

type DailyRes = { summary: string; mood?: string | null; keywords: string[] };

/** 브라우저 로컬 날짜 YYYY-MM-DD (한국 사용자·서버 Asia/Seoul과 대체로 일치) */
function localCalendarDateISO() {
  return new Date().toLocaleDateString("en-CA");
}

export default function DailySummarySection() {
  const { child } = useChild();
  const [data, setData] = useState<DailyRes | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!child?.id) {
      setLoading(false);
      return;
    }
    let cancel = false;
    (async () => {
      setLoading(true);
      setErr(null);
      try {
        const res = await postWithAuth<DailyRes>("/api/ai/daily-summary", {
          child_id: child.id,
          target_date: localCalendarDateISO(),
        });
        if (!cancel) setData(res);
      } catch (e) {
        if (!cancel) setErr(e instanceof Error ? e.message : "불러오기 실패");
      } finally {
        if (!cancel) setLoading(false);
      }
    })();
    return () => {
      cancel = true;
    };
  }, [child?.id]);

  if (!child) return null;

  if (loading) {
    return <p className={styles.muted}>오늘 하루 요약을 불러오는 중...</p>;
  }

  if (err) {
    return (
      <p className={styles.error} role="alert">
        {err}
      </p>
    );
  }

  if (!data) return null;

  return (
    <div className={styles.card}>
      <p className={styles.body}>{data.summary}</p>
      {data.mood ? <p className={styles.meta}>기록된 기분: {data.mood}</p> : null}
      {data.keywords && data.keywords.length > 0 ? (
        <div className={styles.tags}>
          {data.keywords.map((k) => (
            <span key={k} className={styles.tag}>
              {k}
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}
