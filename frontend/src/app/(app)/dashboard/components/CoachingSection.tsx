"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import styles from "./CoachingSection.module.css";

interface Props {
  childId: string | undefined;
  childName: string;
}

interface CoachingData {
  coaching: string;
  tips: string[];
}

export default function CoachingSection({ childId, childName }: Props) {
  const [coaching, setCoaching] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!childId) {
      setLoading(false);
      return;
    }

    api.post<CoachingData>("/api/ai/coaching", { child_id: childId })
      .then((data) => {
        setCoaching(data.coaching);
        setLoading(false);
      })
      .catch(() => {
        setCoaching(null);
        setLoading(false);
      });
  }, [childId]);

  return (
    <section>
      <div className={styles.card}>
        <div className={styles.header}>
          <span className={styles.icon}>✨</span>
          <span className={styles.title}>AI 오늘 코칭</span>
        </div>

        {loading ? (
          <div className={styles.loading}>AI가 오늘 코칭을 준비하고 있어요...</div>
        ) : coaching ? (
          <div className={styles.body}>{coaching}</div>
        ) : (
          <div className={styles.fallback}>
            오늘도 {childName}와(과) 행복한 하루 보내세요! 기록을 남기면 더 맞춤형 코칭을 받을 수 있어요.
          </div>
        )}
      </div>
    </section>
  );
}
