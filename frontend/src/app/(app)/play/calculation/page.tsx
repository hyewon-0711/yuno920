"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import AppHeader from "@/components/layout/AppHeader";
import styles from "./page.module.css";

type Op = "+" | "-" | "×" | "÷";

interface LevelConfig {
  level: number;
  name: string;
  ops: Op[];
  min: number;
  max: number;
  divMax?: number; // 나눗셈용 제수 상한
}

const LEVELS: LevelConfig[] = [
  { level: 1, name: "더하기 기초", ops: ["+"], min: 1, max: 9 },
  { level: 2, name: "더하기 도전", ops: ["+"], min: 1, max: 20 },
  { level: 3, name: "빼기 기초", ops: ["-"], min: 1, max: 20 },
  { level: 4, name: "더하기 & 빼기", ops: ["+", "-"], min: 1, max: 20 },
  { level: 5, name: "곱하기 기초", ops: ["×"], min: 2, max: 9 },
  { level: 6, name: "곱하기 도전", ops: ["×"], min: 2, max: 12 },
  { level: 7, name: "나누기 기초", ops: ["÷"], min: 2, max: 9, divMax: 9 },
  { level: 8, name: "나누기 도전", ops: ["÷"], min: 2, max: 12, divMax: 12 },
  { level: 9, name: "사칙연산 마스터", ops: ["+", "-", "×", "÷"], min: 1, max: 12, divMax: 12 },
];

function generateQuestion(config: LevelConfig): { a: number; b: number; op: Op; answer: number } {
  const op = config.ops[Math.floor(Math.random() * config.ops.length)];

  if (op === "+") {
    const a = config.min + Math.floor(Math.random() * (config.max - config.min + 1));
    const b = config.min + Math.floor(Math.random() * (config.max - config.min + 1));
    return { a, b, op, answer: a + b };
  }

  if (op === "-") {
    const a = config.min + Math.floor(Math.random() * (config.max - config.min + 1));
    const b = config.min + Math.floor(Math.random() * (a - config.min + 1)); // b ≤ a
    return { a, b, op, answer: a - b };
  }

  if (op === "×") {
    const a = config.min + Math.floor(Math.random() * (config.max - config.min + 1));
    const b = config.min + Math.floor(Math.random() * (config.max - config.min + 1));
    return { a, b, op, answer: a * b };
  }

  if (op === "÷") {
    const divMax = config.divMax ?? config.max;
    const b = config.min + Math.floor(Math.random() * (divMax - config.min + 1));
    const quotient = config.min + Math.floor(Math.random() * (config.max - config.min + 1));
    const a = b * quotient;
    return { a, b, op, answer: quotient };
  }

  return { a: 1, b: 1, op: "+", answer: 2 };
}

function generateChoices(answer: number, count = 4): number[] {
  const choices = new Set<number>([answer]);
  const range = Math.max(5, Math.abs(answer) + 5);
  const offsets = [-range, -Math.floor(range / 2), -2, -1, 1, 2, Math.floor(range / 2), range];

  for (const offset of offsets) {
    const candidate = answer + offset;
    if (candidate >= 0 && candidate !== answer && !choices.has(candidate)) {
      choices.add(candidate);
      if (choices.size >= count) break;
    }
  }

  let tries = 0;
  while (choices.size < count && tries < 50) {
    const offset = Math.floor(Math.random() * (range * 2)) - range;
    const candidate = answer + offset;
    if (candidate >= 0 && candidate !== answer) choices.add(candidate);
    tries++;
  }

  return [...choices].slice(0, count).sort(() => Math.random() - 0.5);
}

const LEVEL_UP_SCORE = 5;

export default function CalculationGamePage() {
  const [currentLevel, setCurrentLevel] = useState(1);
  const [combo, setCombo] = useState(0);
  const [totalCorrect, setTotalCorrect] = useState(0);
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);
  const [selectedChoice, setSelectedChoice] = useState<number | null>(null);
  const [question, setQuestion] = useState(() => {
    const config = LEVELS.find((l) => l.level === 1) ?? LEVELS[0];
    return generateQuestion(config);
  });

  const config = LEVELS.find((l) => l.level === currentLevel) ?? LEVELS[LEVELS.length - 1];
  const choices = useMemo(() => generateChoices(question.answer), [question]);

  const nextQuestion = useCallback(() => {
    setQuestion(generateQuestion(config));
    setSelectedChoice(null);
    setFeedback(null);
  }, [config]);

  useEffect(() => {
    setQuestion(generateQuestion(config));
    setSelectedChoice(null);
    setFeedback(null);
  }, [currentLevel]);

  const handleChoiceClick = (choice: number) => {
    if (feedback) return;
    setSelectedChoice(choice);

    if (choice === question.answer) {
      setTotalCorrect((c) => c + 1);
      const newCombo = combo + 1;
      setCombo(newCombo);
      setFeedback("correct");

      if (newCombo >= LEVEL_UP_SCORE && currentLevel < LEVELS.length) {
        setCurrentLevel((l) => l + 1);
        setCombo(0);
      } else {
        setTimeout(nextQuestion, 600);
      }
    } else {
      setCombo(0);
      setFeedback("wrong");
      setTimeout(() => {
        setFeedback(null);
        setSelectedChoice(null);
      }, 800);
    }
  };


  return (
    <>
      <AppHeader title="계산 게임" showBack backHref="/play" />
      <div className={styles.page}>
        <div className={styles.info}>
          <div className={styles.levelBadge}>LV.{currentLevel} {config.name}</div>
          <div className={styles.stats}>
            <span>🎯 맞힌 문제: {totalCorrect}</span>
            <span>🔥 콤보: {combo}/{LEVEL_UP_SCORE}</span>
          </div>
        </div>

        <div className={`${styles.questionCard} ${feedback ? styles[feedback] : ""}`}>
          <div className={styles.problem}>
            <span>{question.a}</span>
            <span className={styles.op}>{question.op}</span>
            <span>{question.b}</span>
            <span className={styles.eq}>=</span>
            <span className={styles.questionMark}>?</span>
          </div>
        </div>

        <div className={styles.choices}>
          {choices.map((choice) => (
            <button
              key={choice}
              type="button"
              className={`${styles.choiceBtn} ${
                selectedChoice === choice
                  ? choice === question.answer
                    ? styles.correct
                    : styles.wrong
                  : ""
              }`}
              onClick={() => handleChoiceClick(choice)}
              disabled={!!feedback}
            >
              {choice}
            </button>
          ))}
        </div>

        <p className={styles.hint}>
          {combo >= LEVEL_UP_SCORE - 1 && currentLevel < LEVELS.length
            ? `🎉 ${LEVEL_UP_SCORE - combo}문제 더 맞추면 레벨업!`
            : "답을 골라 클릭해주세요"}
        </p>
      </div>
    </>
  );
}
