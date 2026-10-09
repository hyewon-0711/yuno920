"use client";

import Link from "next/link";
import AppHeader from "@/components/layout/AppHeader";
import PageIntro from "@/components/layout/PageIntro";
import styles from "./page.module.css";

const games = [
  { icon: "🗺️", name: "보물섬 탐험", desc: "이야기와 문제를 풀며 보물을 찾아요", href: "/play/adventure" },
  { icon: "🔬", name: "과학 실험실", desc: "관찰하고 생각하는 과학 놀이", href: "/play/science" },
  { icon: "👾", name: "몬스터 키우기 수학", desc: "문제를 풀고 몬스터를 키워요", href: "/play/monster" },
  { icon: "🧩", name: "도형 퍼즐 놀이터", desc: "규칙과 모양을 발견해요", href: "/play/puzzle" },
  { icon: "🔤", name: "낱말 탐험", desc: "그림 단서로 낱말을 찾아요", href: "/play/words" },
  { icon: "🎨", name: "픽셀 아트 스튜디오", desc: "나만의 캐릭터를 만들어요", href: "/play/studio" },
  { icon: "🤝", name: "오늘의 가족 미션", desc: "부모님과 함께 작은 도전", href: "/play/missions" },
  { icon: "🔢", name: "계산 게임", desc: "덧셈부터 나눗셈까지 연습해요", href: "/play/calculation" },
  { icon: "🧠", name: "기억력 게임", desc: "카드 짝을 찾아보세요", href: "/play/memory" },
  { icon: "❓", name: "상식 퀴즈", desc: "여러 주제의 상식을 풀어요", href: "/play/quiz" },
  { icon: "♟️", name: "체스", desc: "한 수씩 생각하며 두어요", href: "/play/chess" },
  { icon: "🧱", name: "블록월드 아이디어", desc: "만들고 싶은 것을 상상해요", href: "/play/minecraft" },
  { icon: "🎹", name: "소리 놀이터", desc: "건반을 눌러 음악을 만들어요", href: "/play/keyboard" },
  { icon: "⚫", name: "아홉 줄 바둑", desc: "기본 규칙부터 배워요", href: "/play/baduk" },
];

export default function PlayPage() {
  return (
    <>
      <AppHeader title="놀이" />
      <main className={styles.page}>
        <PageIntro eyebrow="PLAY & DISCOVER" title="놀면서 발견하는 오늘" description="생각하고, 만들고, 함께 도전하며 오늘의 놀이 기록을 남겨보세요." />
        <div className={styles.grid}>
          {games.map((game) => (
            <Link key={game.href} href={game.href} className={styles.gameCard}>
              <span className={styles.gameIcon}>{game.icon}</span>
              <span className={styles.gameName}>{game.name}</span>
              <span className={styles.gameDesc}>{game.desc}</span>
            </Link>
          ))}
        </div>
      </main>
    </>
  );
}
