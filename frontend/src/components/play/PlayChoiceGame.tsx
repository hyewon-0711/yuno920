"use client";

import { useEffect, useRef, useState } from "react";
import AppHeader from "@/components/layout/AppHeader";
import PageIntro from "@/components/layout/PageIntro";
import { useChild } from "@/hooks/useChild";
import { logPlaySession, type NewPlayGameType } from "@/lib/playLogs";
import styles from "./PlayChoiceGame.module.css";

export interface ChoiceRound {
  emoji: string;
  prompt: string;
  question: string;
  choices: string[];
  answer: number;
  explanation: string;
}

interface Props {
  title: string;
  eyebrow: string;
  intro: string;
  gameType: NewPlayGameType;
  rounds: ChoiceRound[];
  completeTitle: string;
  completeDescription: string;
}

export default function PlayChoiceGame({ title, eyebrow, intro, gameType, rounds, completeTitle, completeDescription }: Props) {
  const { child } = useChild();
  const [roundIndex, setRoundIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [correct, setCorrect] = useState(0);
  const [result, setResult] = useState<{ correct: number; score: number } | null>(null);
  const startedAt = useRef<number | null>(null);
  const saved = useRef(false);
  const round = rounds[roundIndex];

  useEffect(() => {
    startedAt.current = Date.now();
  }, []);

  useEffect(() => {
    if (!result || !child || saved.current) return;
    saved.current = true;
    void logPlaySession({
      childId: child.id,
      gameType,
      score: result.score,
      correctCount: result.correct,
      totalCount: rounds.length,
      startedAt: startedAt.current ?? Date.now(),
    }).catch((error) => console.error("Failed to save play log", error));
  }, [child, gameType, result, rounds.length]);

  const choose = (index: number) => {
    if (selected === null) setSelected(index);
  };

  const next = () => {
    if (selected === null) return;
    const nextCorrect = correct + (selected === round.answer ? 1 : 0);
    if (roundIndex === rounds.length - 1) {
      setCorrect(nextCorrect);
      setResult({ correct: nextCorrect, score: nextCorrect * 20 + (nextCorrect === rounds.length ? 20 : 0) });
      return;
    }
    setCorrect(nextCorrect);
    setRoundIndex((index) => index + 1);
    setSelected(null);
  };

  const restart = () => {
    startedAt.current = Date.now();
    saved.current = false;
    setRoundIndex(0);
    setSelected(null);
    setCorrect(0);
    setResult(null);
  };

  return (
    <>
      <AppHeader title={title} showBack backHref="/play" />
      <main className={styles.page}>
        <PageIntro eyebrow={eyebrow} title={title} description={intro} />
        {result ? (
          <section className={styles.resultCard}>
            <div className={styles.resultEmoji}>🎉</div>
            <h2>{completeTitle}</h2>
            <p>{completeDescription}</p>
            <div className={styles.score}>{result.score}점</div>
            <p className={styles.resultMeta}>{rounds.length}문제 중 {result.correct}문제 성공</p>
            <button type="button" className={styles.primaryButton} onClick={restart}>다시 탐험하기</button>
          </section>
        ) : (
          <section className={styles.gameCard}>
            <div className={styles.progressRow}><span>미션 {roundIndex + 1} / {rounds.length}</span><span>현재 점수 {correct * 20}</span></div>
            <div className={styles.progressTrack}><div className={styles.progressValue} style={{ width: `${((roundIndex + 1) / rounds.length) * 100}%` }} /></div>
            <div className={styles.roundHeader}><div className={styles.roundEmoji}>{round.emoji}</div><p className={styles.prompt}>{round.prompt}</p></div>
            <h2 className={styles.question}>{round.question}</h2>
            <div className={styles.choices}>
              {round.choices.map((choice, index) => {
                const isSelected = selected === index;
                const isCorrect = selected !== null && index === round.answer;
                return <button key={choice} type="button" className={`${styles.choice} ${isSelected ? styles.selected : ""} ${isCorrect ? styles.correct : ""}`} onClick={() => choose(index)} disabled={selected !== null}><span className={styles.choiceIndex}>{index + 1}</span>{choice}</button>;
              })}
            </div>
            {selected !== null && <div className={`${styles.explanation} ${selected === round.answer ? styles.explanationGood : styles.explanationTry}`}><strong>{selected === round.answer ? "정답이에요!" : "괜찮아요. 다시 생각해봐요!"}</strong><span>{round.explanation}</span></div>}
            <button type="button" className={styles.primaryButton} onClick={next} disabled={selected === null}>{roundIndex === rounds.length - 1 ? "결과 보기" : "다음 미션"}</button>
          </section>
        )}
      </main>
    </>
  );
}
