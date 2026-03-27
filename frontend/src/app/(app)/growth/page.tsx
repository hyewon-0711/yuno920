"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useChild } from "@/hooks/useChild";
import { useGrowthMetrics } from "@/hooks/useGrowthMetrics";
import { useHexagon } from "@/hooks/useHexagon";
import { useReadingGrowth } from "@/hooks/useReadingGrowth";
import AppHeader from "@/components/layout/AppHeader";
import PhysicalGrowthSection from "./components/PhysicalGrowthSection";
import LearningSection from "./components/LearningSection";
import HexagonSection from "./components/HexagonSection";
import ReadingGrowthSection from "./components/ReadingGrowthSection";
import GrowthAdviceSection from "./components/GrowthAdviceSection";
import styles from "./page.module.css";

export default function GrowthPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { child, loading: childLoading } = useChild();
  const { physical, learning, loading: metricsLoading, loadError: metricsLoadError, addPhysical, addLearning } =
    useGrowthMetrics(child?.id);
  const { scores, loading: hexagonLoading, calculateWithAI, saveManual, LABELS } = useHexagon(child?.id);
  const { data: readingData, loading: readingLoading } = useReadingGrowth(child?.id, 6);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace("/auth/login");
      return;
    }
    if (childLoading) return;
    if (!child) {
      router.replace("/onboarding");
    }
  }, [authLoading, user, childLoading, child, router]);

  if (authLoading || childLoading || !child) {
    return (
      <>
        <AppHeader title="Growth" />
        <div className={styles.page}>
          <p style={{ textAlign: "center", color: "var(--text-tertiary)", padding: "var(--space-8) 0" }}>
            불러오는 중...
          </p>
        </div>
      </>
    );
  }

  return (
    <>
      <AppHeader title="Growth" />
      <div className={styles.page}>
        <section className={styles.greeting}>
          <h2 className="text-h1">{child.name}의 성장</h2>
          <p className="text-body-sm" style={{ color: "var(--text-tertiary)" }}>
            신체, 학습, 독서 데이터를 추적하고 AI 분석을 받아보세요
          </p>
        </section>

        {metricsLoadError && (
          <p
            className="text-body-sm"
            style={{
              margin: "0 0 var(--space-4)",
              padding: "var(--space-3)",
              borderRadius: "var(--radius-md)",
              background: "var(--bg-muted)",
              color: "var(--action-destructive, #b91c1c)",
            }}
            role="alert"
          >
            성장 기록을 불러오지 못했습니다: {metricsLoadError}
          </p>
        )}

        <PhysicalGrowthSection
          childId={child.id}
          data={physical}
          loading={metricsLoading}
          onAdd={addPhysical}
        />

        <LearningSection
          data={learning}
          loading={metricsLoading}
          onAdd={addLearning}
        />

        <HexagonSection
          scores={scores}
          loading={hexagonLoading}
          labels={LABELS}
          onCalculateAI={calculateWithAI}
          onSaveManual={saveManual}
        />

        <ReadingGrowthSection data={readingData} loading={readingLoading} />

        <GrowthAdviceSection childId={child.id} scores={scores} />
      </div>
    </>
  );
}
