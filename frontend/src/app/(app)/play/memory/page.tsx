"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import AppHeader from "@/components/layout/AppHeader";
import CelebrationOverlay from "@/components/ui/CelebrationOverlay";
import styles from "./page.module.css";

const EMOJI_POOL = [
  "🐶", "🐱", "🐭", "🐹", "🐰", "🦊", "🐻", "🐼", "🦁", "🐯",
  "🐸", "🐵", "🐔", "🦄", "🌸", "🌻", "🍎", "🍊", "🍋", "🍇",
];

interface LevelConfig {
  level: number;
  name: string;
  rows: number;
  cols: number;
  pairs: number;
  timeLimit: number; // seconds
}

const LEVELS: LevelConfig[] = [
  { level: 1, name: "쉬움", rows: 3, cols: 4, pairs: 6, timeLimit: 120 },
  { level: 2, name: "쉬움", rows: 3, cols: 4, pairs: 6, timeLimit: 120 },
  { level: 3, name: "쉬움", rows: 3, cols: 4, pairs: 6, timeLimit: 120 },
  { level: 4, name: "보통", rows: 4, cols: 4, pairs: 8, timeLimit: 120 },
  { level: 5, name: "보통", rows: 4, cols: 4, pairs: 8, timeLimit: 120 },
  { level: 6, name: "보통", rows: 4, cols: 4, pairs: 8, timeLimit: 120 },
  { level: 7, name: "어려움", rows: 4, cols: 5, pairs: 10, timeLimit: 150 },
  { level: 8, name: "어려움", rows: 4, cols: 5, pairs: 10, timeLimit: 150 },
  { level: 9, name: "어려움", rows: 4, cols: 5, pairs: 10, timeLimit: 150 },
  { level: 10, name: "마스터", rows: 5, cols: 6, pairs: 15, timeLimit: 180 },
];

type GamePhase = "preview" | "playing" | "finished";

interface Card {
  id: number;
  emoji: string;
  matched: boolean;
}

function createCards(pairs: number): Card[] {
  const emojis = [...EMOJI_POOL]
    .sort(() => Math.random() - 0.5)
    .slice(0, pairs);
  const cards: Card[] = [];
  emojis.forEach((emoji, i) => {
    cards.push({ id: i * 2, emoji, matched: false });
    cards.push({ id: i * 2 + 1, emoji, matched: false });
  });
  return cards.sort(() => Math.random() - 0.5);
}

function formatTime(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function MemoryGamePage() {
  const [currentLevel, setCurrentLevel] = useState(1);
  const [phase, setPhase] = useState<GamePhase>("preview");
  const [cards, setCards] = useState<Card[]>([]);
  const [flipped, setFlipped] = useState<Set<number>>(new Set());
  const [attempts, setAttempts] = useState(0);
  const [timeLeft, setTimeLeft] = useState(120);
  const [shakeCards, setShakeCards] = useState<Set<number>>(new Set());
  const [showCelebration, setShowCelebration] = useState(false);

  const config = LEVELS.find((l) => l.level === currentLevel) ?? LEVELS[LEVELS.length - 1];

  const cardsForLevel = useMemo(() => createCards(config.pairs), [currentLevel, config.pairs]);

  useEffect(() => {
    setCards(cardsForLevel);
    setFlipped(new Set());
    setAttempts(0);
    setTimeLeft(config.timeLimit);
    setPhase("preview");
    setShakeCards(new Set());
  }, [currentLevel, config.timeLimit, cardsForLevel]);

  useEffect(() => {
    if (phase !== "preview") return;
    const t = setTimeout(() => {
      setPhase("playing");
    }, 2000);
    return () => clearTimeout(t);
  }, [phase]);

  useEffect(() => {
    if (phase !== "playing") return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setPhase("finished");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [phase]);

  const handleCardClick = useCallback(
    (id: number) => {
      if (phase !== "playing") return;
      const card = cards.find((c) => c.id === id);
      if (!card || card.matched || flipped.has(id)) return;
      if (flipped.size >= 2) return;

      const newFlipped = new Set(flipped);
      newFlipped.add(id);
      setFlipped(newFlipped);

      if (newFlipped.size === 2) {
        setAttempts((a) => a + 1);
        const [aId, bId] = [...newFlipped];
        const cardA = cards.find((c) => c.id === aId)!;
        const cardB = cards.find((c) => c.id === bId)!;

        if (cardA.emoji === cardB.emoji) {
          setCards((prev) =>
            prev.map((c) =>
              c.id === aId || c.id === bId ? { ...c, matched: true } : c
            )
          );
          setFlipped(new Set());
        } else {
          setShakeCards(new Set([aId, bId]));
          setTimeout(() => {
            setFlipped(new Set());
            setShakeCards(new Set());
          }, 800);
        }
      }
    },
    [phase, cards, flipped]
  );

  const matchedCount = cards.filter((c) => c.matched).length / 2;
  const allMatched = matchedCount >= config.pairs;

  useEffect(() => {
    if (phase === "playing" && allMatched) {
      setPhase("finished");
      setShowCelebration(true);
    }
  }, [phase, allMatched, config.pairs]);

  const handleGoNextLevel = () => {
    if (currentLevel < LEVELS.length) {
      setCurrentLevel((l) => l + 1);
    } else {
      setCurrentLevel(1);
    }
  };

  const score = useMemo(() => {
    if (phase !== "finished") return 0;
    const base = matchedCount * 10;
    const perfectBonus = attempts === config.pairs ? 50 : attempts <= config.pairs * 1.3 ? 30 : attempts <= config.pairs * 1.5 ? 10 : 0;
    const timeBonus = timeLeft > config.timeLimit / 2 ? 20 : 0;
    return base + perfectBonus + timeBonus;
  }, [phase, matchedCount, attempts, config.pairs, timeLeft, config.timeLimit]);

  const startNewGame = () => {
    setCards(createCards(config.pairs));
    setFlipped(new Set());
    setAttempts(0);
    setTimeLeft(config.timeLimit);
    setPhase("preview");
    setShakeCards(new Set());
  };


  return (
    <>
      <CelebrationOverlay
        show={showCelebration}
        onComplete={() => setShowCelebration(false)}
        message="🎉 클리어! 🎉"
      />
      <AppHeader title="기억력 게임" showBack backHref="/play" />
      <div className={styles.page}>
        <div className={styles.info}>
          <div className={styles.levelBadge}>
            LV.{currentLevel} {config.name}
          </div>
          {phase !== "finished" && (
            <div className={styles.stats}>
              <span>⏱️ {formatTime(timeLeft)}</span>
              <span>🎯 시도: {attempts}</span>
              <span>✅ {matchedCount}/{config.pairs} 짝</span>
            </div>
          )}
        </div>

        {phase === "finished" ? (
          <div className={styles.resultCard}>
            <h3 className={styles.resultTitle}>
              {allMatched ? "🎉 모두 맞췄어요!" : "⏰ 시간 초과"}
            </h3>
            <div className={styles.resultStats}>
              <p>점수: <strong>{score}</strong>점</p>
              <p>시도 횟수: {attempts}회</p>
              <p>맞춘 짝: {matchedCount}/{config.pairs}</p>
              {allMatched && timeLeft > 0 && (
                <p className={styles.timeLeft}>남은 시간: {formatTime(timeLeft)}</p>
              )}
            </div>
            <div className={styles.resultActions}>
              <button type="button" className={styles.resultBtn} onClick={startNewGame}>
                다시 하기
              </button>
              <button type="button" className={styles.resultBtnPrimary} onClick={handleGoNextLevel}>
                {currentLevel < LEVELS.length ? "다음 레벨" : "처음부터"}
              </button>
            </div>
          </div>
        ) : (
          <>
            <div
              className={styles.grid}
              style={{
                gridTemplateColumns: `repeat(${config.cols}, 1fr)`,
                gridTemplateRows: `repeat(${config.rows}, 1fr)`,
                aspectRatio: `${config.cols} / ${config.rows}`,
              }}
            >
              {cards.map((card) => (
                <button
                  key={card.id}
                  type="button"
                  className={`${styles.card} ${
                    flipped.has(card.id) || card.matched || phase === "preview"
                      ? styles.flipped
                      : ""
                  } ${card.matched ? styles.matched : ""} ${
                    shakeCards.has(card.id) ? styles.shake : ""
                  }`}
                  onClick={() => handleCardClick(card.id)}
                  disabled={phase === "preview" || card.matched}
                >
                  <div className={styles.cardInner}>
                    <div className={styles.cardFront}>?</div>
                    <div className={styles.cardBack}>{card.emoji}</div>
                  </div>
                </button>
              ))}
            </div>
            {phase === "preview" && (
              <p className={styles.hint}>잘 기억해두세요! 2초 후 시작해요</p>
            )}
          </>
        )}
      </div>
    </>
  );
}
