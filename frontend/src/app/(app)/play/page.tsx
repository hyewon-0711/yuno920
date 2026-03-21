"use client";

import Link from "next/link";
import AppHeader from "@/components/layout/AppHeader";
import styles from "./page.module.css";

const games = [
  { icon: "🔢", name: "계산 게임", desc: "더하기·빼기·곱하기·나누기", href: "/play/calculation" },
  { icon: "🧠", name: "기억력 게임", desc: "카드 짝 맞추기", href: null },
  { icon: "📖", name: "독서 퀴즈", desc: "읽은 책 기반 퀴즈", href: null },
  { icon: "🎯", name: "오늘의 미션", desc: "매일 새로운 도전", href: null },
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
          {games.map((g) => {
            const card = (
              <>
                <span className={styles.gameIcon}>{g.icon}</span>
                <span className={styles.gameName}>{g.name}</span>
                <span className={styles.gameDesc}>{g.desc}</span>
              </>
            );
            return g.href ? (
              <Link key={g.name} href={g.href} className={styles.gameCard}>
                {card}
              </Link>
            ) : (
              <div key={g.name} className={styles.gameCard}>
                {card}
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
