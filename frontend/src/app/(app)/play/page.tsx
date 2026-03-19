"use client";

import AppHeader from "@/components/layout/AppHeader";
import styles from "./page.module.css";

const games = [
  { icon: "🔢", name: "계산 게임", desc: "재미있는 수학 문제" },
  { icon: "🧠", name: "기억력 게임", desc: "카드 짝 맞추기" },
  { icon: "📖", name: "독서 퀴즈", desc: "읽은 책 기반 퀴즈" },
  { icon: "🎯", name: "오늘의 미션", desc: "매일 새로운 도전" },
];

export default function PlayPage() {
  return (
    <>
      <AppHeader title="Play" />
      <div className={styles.page}>
        <h3 className="text-h3" style={{ marginBottom: "var(--space-4)" }}>
          🎮 어떤 놀이 할까?
        </h3>
        <div className={styles.grid}>
          {games.map((g) => (
            <div key={g.name} className={styles.gameCard}>
              <span className={styles.gameIcon}>{g.icon}</span>
              <span className={styles.gameName}>{g.name}</span>
              <span className={styles.gameDesc}>{g.desc}</span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
