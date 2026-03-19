"use client";

import AppHeader from "@/components/layout/AppHeader";
import styles from "./page.module.css";

export default function GrowthPage() {
  return (
    <>
      <AppHeader title="Growth" />
      <div className={styles.page}>
        <section className={styles.section}>
          <h3 className="text-h3">📏 신체 성장</h3>
          <div className={styles.placeholder}>성장 그래프가 표시됩니다</div>
        </section>

        <section className={styles.section}>
          <h3 className="text-h3">🏆 6각형 인재 분석</h3>
          <div className={styles.placeholder}>헥사곤 차트가 표시됩니다</div>
        </section>

        <section className={styles.section}>
          <h3 className="text-h3">📊 학습 지표</h3>
          <div className={styles.placeholder}>학습 지표 그래프가 표시됩니다</div>
        </section>

        <section className={styles.section}>
          <h3 className="text-h3">📚 독서 성장</h3>
          <div className={styles.placeholder}>독서 성장 차트가 표시됩니다</div>
        </section>
      </div>
    </>
  );
}
