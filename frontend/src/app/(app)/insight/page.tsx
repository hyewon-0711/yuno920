"use client";

import AppHeader from "@/components/layout/AppHeader";
import DailySummarySection from "./components/DailySummarySection";
import ParentTrendsSection from "./components/ParentTrendsSection";
import styles from "./page.module.css";

export default function InsightPage() {
  return (
    <>
      <AppHeader title="Insight" />
      <div className={styles.page}>
        <section className={styles.section}>
          <h3 className="text-h3">🏷 부모 관심사 · 데일리 트렌드</h3>
          <p className={styles.sectionLead}>
            가입·온보딩에서 고른 태그를 바탕으로 오늘 관련 뉴스 헤드라인을 모아둡니다.
          </p>
          <ParentTrendsSection />
        </section>

        <section className={styles.section}>
          <h3 className="text-h3">✨ 하루 요약</h3>
          <p className={styles.sectionLead}>오늘 날짜 기준으로 기록·독서를 바탕으로 AI가 요약합니다. (기록이 없으면 안내만 표시돼요)</p>
          <DailySummarySection />
        </section>

        <section className={styles.section}>
          <h3 className="text-h3">📊 주간 리포트</h3>
          <div className={styles.placeholder}>주간 분석 리포트가 표시됩니다</div>
        </section>

        <section className={styles.section}>
          <h3 className="text-h3">📈 월간 리포트</h3>
          <div className={styles.placeholder}>월간 성장 리포트가 표시됩니다</div>
        </section>

        <section className={styles.section}>
          <h3 className="text-h3">🧑‍🏫 AI 육아 코칭</h3>
          <div className={styles.placeholder}>맞춤형 육아 코칭이 표시됩니다</div>
        </section>
      </div>
    </>
  );
}
