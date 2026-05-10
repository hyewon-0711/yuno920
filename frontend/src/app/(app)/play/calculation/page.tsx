"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import AppHeader from "@/components/layout/AppHeader";
import CelebrationOverlay from "@/components/ui/CelebrationOverlay";
import styles from "./page.module.css";

type Op = "+" | "-" | "×" | "÷";

interface LevelConfig {
  level: number;
  name: string;
  area: "덧셈" | "뺄셈" | "곱셈" | "나눗셈" | "혼합";
  summary: string;
  ops: Op[];
  min: number;
  max: number;
  divMax?: number; // 나눗셈용 제수 상한
  dividendMin?: number; // 나눗셈용 피제수 최소
  dividendMax?: number; // 나눗셈용 피제수 최대
  quotientMin?: number; // 나눗셈 몫 최소
  quotientMax?: number; // 나눗셈 몫 최대
}

const LEVELS: LevelConfig[] = [
  { level: 1, name: "덧셈 기초", area: "덧셈", summary: "한 자리 수 덧셈", ops: ["+"], min: 1, max: 9 },
  { level: 2, name: "덧셈 확장", area: "덧셈", summary: "두 자리 수 덧셈", ops: ["+"], min: 1, max: 20 },
  { level: 3, name: "뺄셈 기초", area: "뺄셈", summary: "받아내림 없는 뺄셈", ops: ["-"], min: 1, max: 20 },
  { level: 4, name: "덧셈·뺄셈 혼합", area: "혼합", summary: "덧셈과 뺄셈 섞기", ops: ["+", "-"], min: 1, max: 20 },
  { level: 5, name: "곱셈 기초", area: "곱셈", summary: "2~9단 곱셈", ops: ["×"], min: 2, max: 9 },
  { level: 6, name: "곱셈 확장", area: "곱셈", summary: "2~12단 곱셈", ops: ["×"], min: 2, max: 12 },
  { level: 7, name: "나눗셈 기초", area: "나눗셈", summary: "한 자리 ÷ 한 자리", ops: ["÷"], min: 2, max: 9, divMax: 9 },
  { level: 8, name: "나눗셈 확장", area: "나눗셈", summary: "두 자리 ÷ 한 자리", ops: ["÷"], min: 2, max: 12, divMax: 12 },
  {
    level: 9,
    name: "세 자리 ÷ 한 자리 (쉬움)",
    area: "나눗셈",
    summary: "정확히 나누어떨어지는 쉬운 문제",
    ops: ["÷"],
    min: 2,
    max: 45,
    divMax: 6,
    dividendMin: 100,
    dividendMax: 399,
    quotientMin: 10,
    quotientMax: 45,
  },
  {
    level: 10,
    name: "세 자리 ÷ 한 자리 (보통)",
    area: "나눗셈",
    summary: "세 자리 나눗셈 기본 훈련",
    ops: ["÷"],
    min: 2,
    max: 80,
    divMax: 9,
    dividendMin: 100,
    dividendMax: 699,
    quotientMin: 15,
    quotientMax: 80,
  },
  {
    level: 11,
    name: "세 자리 ÷ 한 자리 (어려움)",
    area: "나눗셈",
    summary: "몫이 큰 고난도 훈련",
    ops: ["÷"],
    min: 2,
    max: 120,
    divMax: 9,
    dividendMin: 300,
    dividendMax: 999,
    quotientMin: 30,
    quotientMax: 120,
  },
  { level: 12, name: "사칙연산 마스터", area: "혼합", summary: "사칙연산 종합", ops: ["+", "-", "×", "÷"], min: 1, max: 12, divMax: 12 },
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
    if (config.dividendMin && config.dividendMax) {
      let b = 2 + Math.floor(Math.random() * Math.max(1, divMax - 1));
      const qMin = config.quotientMin ?? config.min;
      const qMax = config.quotientMax ?? config.max;
      let quotient = qMin + Math.floor(Math.random() * (qMax - qMin + 1));
      let a = b * quotient;
      let guard = 0;
      while ((a < config.dividendMin || a > config.dividendMax) && guard < 100) {
        b = 2 + Math.floor(Math.random() * Math.max(1, divMax - 1));
        quotient = qMin + Math.floor(Math.random() * (qMax - qMin + 1));
        a = b * quotient;
        guard++;
      }
      return { a, b, op, answer: quotient };
    }

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
  const [showLevelPicker, setShowLevelPicker] = useState(true);
  const [combo, setCombo] = useState(0);
  const [totalCorrect, setTotalCorrect] = useState(0);
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);
  const [selectedChoice, setSelectedChoice] = useState<number | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [question, setQuestion] = useState(() => {
    const config = LEVELS.find((l) => l.level === 1) ?? LEVELS[0];
    return generateQuestion(config);
  });

  const config = LEVELS.find((l) => l.level === currentLevel) ?? LEVELS[LEVELS.length - 1];
  const choices = useMemo(() => generateChoices(question.answer), [question]);
  const groupedLevels = useMemo(() => {
    const areas: LevelConfig["area"][] = ["덧셈", "뺄셈", "곱셈", "나눗셈", "혼합"];
    return areas.map((area) => ({
      area,
      levels: LEVELS.filter((level) => level.area === area),
    }));
  }, []);

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
        setShowCelebration(true);
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

  const handleSelectLevel = (level: number) => {
    setCurrentLevel(level);
    setCombo(0);
    setTotalCorrect(0);
    setFeedback(null);
    setSelectedChoice(null);
    setShowLevelPicker(false);
  };

  const handleChangeLevel = () => {
    setShowLevelPicker(true);
    setFeedback(null);
    setSelectedChoice(null);
  };

  return (
    <>
      <CelebrationOverlay show={showCelebration} onComplete={() => setShowCelebration(false)} />
      <AppHeader title="계산 게임" showBack backHref="/play" />
      <div className={styles.page}>
        {showLevelPicker && (
          <div className={styles.levelPicker}>
            <h3 className={styles.pickerTitle}>시작할 학습 수준을 선택해 주세요</h3>
            <p className={styles.pickerDesc}>구몬처럼 영역과 수준을 먼저 고르고 시작할 수 있어요.</p>

            {groupedLevels.map((group) => (
              <div key={group.area} className={styles.levelGroup}>
                <div className={styles.groupTitle}>{group.area}</div>
                <div className={styles.levelGrid}>
                  {group.levels.map((level) => (
                    <button
                      key={level.level}
                      type="button"
                      className={styles.levelBtn}
                      onClick={() => handleSelectLevel(level.level)}
                    >
                      <span className={styles.levelBtnTitle}>LV.{level.level} {level.name}</span>
                      <span className={styles.levelBtnDesc}>{level.summary}</span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {!showLevelPicker && (
          <>
        <div className={styles.info}>
          <div className={styles.levelBadge}>LV.{currentLevel} {config.name}</div>
          <div className={styles.stats}>
            <span>🎯 맞힌 문제: {totalCorrect}</span>
            <span>🔥 콤보: {combo}/{LEVEL_UP_SCORE}</span>
          </div>
          <button type="button" className={styles.changeLevelBtn} onClick={handleChangeLevel}>
            수준 다시 선택
          </button>
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
          </>
        )}
      </div>
    </>
  );
}
