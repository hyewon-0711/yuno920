"use client";

import styles from "./ReadingSection.module.css";

interface Props {
  totalMinutes: number;
  bookCount: number;
  recentBook: string | null;
  goalMinutes: number;
  loading: boolean;
}

export default function ReadingSection({ totalMinutes, bookCount, recentBook, goalMinutes, loading }: Props) {
  const percent = Math.min(100, Math.round((totalMinutes / goalMinutes) * 100));
  const isComplete = percent >= 100;

  if (loading) return null;

  return (
    <section>
      <div className={styles.card}>
        <h3 className={styles.sectionTitle}>📖 오늘의 독서</h3>

        <div className={styles.goal}>📚 목표: {goalMinutes}분</div>

        <div className={styles.progressBar}>
          <div
            className={`${styles.progressFill} ${isComplete ? styles.progressComplete : ""}`}
            style={{ width: `${percent}%` }}
          />
        </div>

        <div className={styles.row}>
          <span className={styles.achieved}>
            {isComplete ? "✅ 목표 달성!" : `${totalMinutes}분 달성 (${percent}%)`}
          </span>
          {bookCount > 0 && <span className={styles.achieved}>{bookCount}권</span>}
        </div>

        {recentBook ? (
          <div className={styles.recentBook} style={{ marginTop: "var(--space-2)" }}>
            최근: &ldquo;{recentBook}&rdquo;
          </div>
        ) : (
          <div className={styles.empty}>오늘 첫 독서를 시작해볼까요?</div>
        )}
      </div>
    </section>
  );
}
