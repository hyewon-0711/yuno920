"use client";

import AppHeader from "@/components/layout/AppHeader";
import PageIntro from "@/components/layout/PageIntro";
import DailySummarySection from "./components/DailySummarySection";
import ParentTrendsSection from "./components/ParentTrendsSection";
import InsightAiSections from "./components/InsightAiSections";
import styles from "./page.module.css";

export default function InsightPage() {
  return (
    <>
      <AppHeader title="인사이트" />
      <div className={styles.page}>
        <PageIntro eyebrow="GROWING TOGETHER" title="기록 속에서 발견하는 가능성" description="아이의 하루를 돌아보고, 우리 가족에게 필요한 이야기를 만나보세요." />
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

        <InsightAiSections />
      </div>
    </>
  );
}
