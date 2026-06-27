"use client";

import { useState } from "react";
import Link from "next/link";
import Button from "@/components/ui/Button";
import { useChild } from "@/hooks/useChild";
import { useActivities } from "@/hooks/useActivities";
import { postWithAuth } from "@/lib/api";
import styles from "../page.module.css";

type ReportResponse = { content: string; metadata: { record_count?: number; reading_count?: number } };
type CoachingResponse = { coaching: string; tips: string[] };

function calendarDate(date: Date) {
  return date.toLocaleDateString("en-CA");
}

function range(days: number) {
  const end = new Date();
  const start = new Date(end);
  start.setDate(start.getDate() - (days - 1));
  return { start_date: calendarDate(start), end_date: calendarDate(end) };
}

export default function InsightAiSections() {
  const { child } = useChild();
  const { activities, latestAssessment, isAssessmentStale } = useActivities(child?.id);
  const [weekly, setWeekly] = useState<ReportResponse | null>(null);
  const [monthly, setMonthly] = useState<ReportResponse | null>(null);
  const [coaching, setCoaching] = useState<CoachingResponse | null>(null);
  const [loading, setLoading] = useState<"weekly" | "monthly" | "coaching" | null>(null);
  const [error, setError] = useState("");

  const generate = async (kind: "weekly" | "monthly" | "coaching") => {
    if (!child || loading) return;
    setLoading(kind);
    setError("");
    try {
      if (kind === "coaching") {
        setCoaching(await postWithAuth<CoachingResponse>("/api/ai/coaching", { child_id: child.id }));
      } else {
        const days = kind === "weekly" ? 7 : 30;
        const result = await postWithAuth<ReportResponse>(`/api/ai/${kind}-report`, {
          child_id: child.id,
          ...range(days),
        });
        if (kind === "weekly") setWeekly(result);
        else setMonthly(result);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "AI 결과를 가져오지 못했습니다.");
    } finally {
      setLoading(null);
    }
  };

  return (
    <>
      <section className={styles.section}>
        <h3 className="text-h3">🧭 활동 균형</h3>
        <div className={styles.aiCard}>
          {latestAssessment ? (
            <>
              <strong>{latestAssessment.score}점{isAssessmentStale ? " · 재분석 필요" : ""}</strong>
              <p>{latestAssessment.summary}</p>
            </>
          ) : (
            <p>{activities.length ? "등록한 활동의 균형을 아직 분석하지 않았습니다." : "활동을 등록하면 균형 분석을 받을 수 있습니다."}</p>
          )}
          <Link href="/activities" className={styles.inlineLink}>활동 분석으로 이동</Link>
        </div>
      </section>

      <ReportCard title="📊 주간 리포트" data={weekly} loading={loading === "weekly"} onGenerate={() => void generate("weekly")} />
      <ReportCard title="📈 월간 리포트" data={monthly} loading={loading === "monthly"} onGenerate={() => void generate("monthly")} />

      <section className={styles.section}>
        <h3 className="text-h3">🧑‍🏫 AI 육아 코칭</h3>
        <div className={styles.aiCard}>
          {coaching ? (
            <>
              <p>{coaching.coaching}</p>
              {coaching.tips.length > 0 && <ul>{coaching.tips.map((tip) => <li key={tip}>{tip}</li>)}</ul>}
            </>
          ) : <p>오늘 일정과 최근 기록을 바탕으로 실천 가능한 코칭을 생성합니다.</p>}
          <Button onClick={() => void generate("coaching")} loading={loading === "coaching"} disabled={Boolean(loading)}>
            {coaching ? "코칭 다시 받기" : "오늘의 코칭 받기"}
          </Button>
        </div>
      </section>
      {error && <p className={styles.error} role="alert">{error}</p>}
    </>
  );
}

function ReportCard({
  title,
  data,
  loading,
  onGenerate,
}: {
  title: string;
  data: ReportResponse | null;
  loading: boolean;
  onGenerate: () => void;
}) {
  return (
    <section className={styles.section}>
      <h3 className="text-h3">{title}</h3>
      <div className={styles.aiCard}>
        {data ? (
          <>
            <p>{data.content}</p>
            <span className={styles.meta}>기록 {data.metadata.record_count ?? 0}건 · 독서 {data.metadata.reading_count ?? 0}건</span>
          </>
        ) : <p>선택한 기간의 기록과 독서를 AI가 요약합니다.</p>}
        <Button onClick={onGenerate} loading={loading}>{data ? "다시 생성" : "리포트 생성"}</Button>
      </div>
    </section>
  );
}
