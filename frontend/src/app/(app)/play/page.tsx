"use client";

import Link from "next/link";
import AppHeader from "@/components/layout/AppHeader";
import PageIntro from "@/components/layout/PageIntro";
import styles from "./page.module.css";

const games = [
  { icon: "⌨️", name: "키캡 소리 놀이", desc: "청축부터 바나나축까지 톡톡!", href: "/play/keyboard" },
  { icon: "♟️", name: "체스", desc: "컴퓨터와 연습하거나 함께 두기", href: "/play/chess" },
  { icon: "⚫", name: "윤호의 9줄 바둑", desc: "기본 규칙을 배우며 함께 대국해요", href: "/play/baduk" },
  { icon: "⛏️", name: "마인크래프트 퀴즈", desc: "블록 세계 지식에 도전하기", href: "/play/minecraft" },
  { icon: "🔢", name: "계산 게임", desc: "더하기·빼기·곱하기·나누기", href: "/play/calculation" },
  { icon: "🧠", name: "기억력 게임", desc: "카드 짝 맞추기", href: "/play/memory" },
  { icon: "📖", name: "상식 퀴즈", desc: "영역별 상식 퀴즈", href: "/play/quiz" },
  { icon: "🎯", name: "오늘의 미션", desc: "매일 새로운 도전", href: null },
];

export default function PlayPage() {
  return (
    <>
      <AppHeader title="놀이" />
      <div className={styles.page}>
        <PageIntro eyebrow="PLAY & DISCOVER" title="놀이 속에서 한 뼘 더" description="생각하고, 발견하고, 함께 웃어요. 오늘은 어떤 놀이를 해볼까요?" />
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
              <div key={g.name} className={`${styles.gameCard} ${styles.comingSoon}`}>
                {card}
                <span className={styles.badge}>준비 중</span>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
