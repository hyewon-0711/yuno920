"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui";
import type { HexagonScores } from "@/hooks/useHexagon";
import styles from "./GrowthAdviceSection.module.css";

const AREA_MAP: Record<keyof HexagonScores, string> = {
  learning: "학습",
  physical: "신체",
  social: "사회성",
  emotion: "감정",
  creativity: "창의성",
  habit: "습관",
};

interface Props {
  childId: string | undefined;
  scores: HexagonScores | null;
}

export default function GrowthAdviceSection({ childId, scores }: Props) {
  const [advice, setAdvice] = useState("");
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const weakAreas = scores
    ? (Object.entries(scores) as [keyof HexagonScores, number][])
        .filter(([, v]) => v < 50)
        .map(([k]) => AREA_MAP[k])
    : [];

  const handleAnalyze = async () => {
    if (!childId) return;
    setLoading(true);
    setAdvice("");
    setRecommendations([]);
    try {
      const res = await api.post<{ advice: string; recommendations: string[] }>(
        "/api/ai/growth-advice",
        { child_id: childId, weak_areas: weakAreas.length > 0 ? weakAreas : ["전반적 개선"] }
      );
      setAdvice(res.advice);
      setRecommendations(res.recommendations || []);
    } catch {
      setAdvice("AI 분석을 불러오는데 실패했습니다. 6각형 역량을 먼저 분석해주세요.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className={styles.section}>
      <h3 className={styles.title}>💡 AI 성장 조언</h3>
      <p className={styles.desc}>
        {weakAreas.length > 0
          ? `부족한 영역: ${weakAreas.join(", ")} — AI가 개선 방안을 제안해요`
          : "6각형 역량을 분석하면 AI가 맞춤 조언을 드려요"}
      </p>
      <Button onClick={handleAnalyze} loading={loading} disabled={!childId}>
        AI 조언 받기
      </Button>
      {advice && (
        <div className={styles.result}>
          <p className={styles.advice}>{advice}</p>
          {recommendations.length > 0 && (
            <ul className={styles.list}>
              {recommendations.map((r, i) => (
                <li key={i}>{r}</li>
              ))}
            </ul>
          )}
        </div>
      )}
    </section>
  );
}
