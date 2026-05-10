"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import AppHeader from "@/components/layout/AppHeader";
import CelebrationOverlay from "@/components/ui/CelebrationOverlay";
import styles from "./page.module.css";

type Op = "+" | "-" | "×" | "÷";
type ThemeMode = "default" | "siblings" | "blockworld";

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

const THEME_LABEL: Record<ThemeMode, string> = {
  default: "일반",
  siblings: "브이로그 남매",
  blockworld: "블록월드",
};

const THEME_STORIES: Record<ThemeMode, Record<Op, string[]>> = {
  default: {
    "+": [
      "연필 {a}자루에 {b}자루를 더하면 몇 자루일까요?",
      "쿠키 {a}개와 {b}개를 합치면 몇 개인가요?",
      "스티커 {a}장에 {b}장을 더했어요. 총 몇 장일까요?",
      "공원에서 새를 {a}마리 보고, 나중에 {b}마리를 더 봤어요. 모두 몇 마리일까요?",
      "레고 블록 {a}개에 {b}개를 추가했어요. 합계는?",
    ],
    "-": [
      "사탕이 {a}개 있었는데 {b}개 먹었어요. 몇 개 남았을까요?",
      "색연필 {a}자루 중 {b}자루를 빌려줬어요. 남은 개수는?",
      "풍선 {a}개에서 {b}개가 터졌어요. 몇 개 남았나요?",
      "점수 {a}점에서 {b}점을 잃었어요. 현재 점수는?",
      "블록 {a}개를 쌓고 {b}개를 뺐어요. 남은 블록은?",
    ],
    "×": [
      "한 상자에 {a}개씩, {b}상자가 있어요. 총 몇 개일까요?",
      "한 줄에 {a}명씩 {b}줄로 섰어요. 모두 몇 명인가요?",
      "한 봉지에 {a}개씩 {b}봉지가 있어요. 합계는?",
      "페이지마다 스티커 {a}개, {b}페이지를 채웠어요. 총 몇 개?",
      "한 판에 {a}개 조각, {b}판이면 모두 몇 조각일까요?",
    ],
    "÷": [
      "{a}개를 {b}명에게 똑같이 나누면 한 명당 몇 개일까요?",
      "{a}점을 {b}문제에 똑같이 나누면 문제당 몇 점일까요?",
      "블록 {a}개를 상자 {b}개에 같은 수로 넣으면 상자당 몇 개?",
      "{a}개의 카드를 {b}묶음으로 나누면 한 묶음은 몇 장일까요?",
      "{a}분을 {b}구간으로 똑같이 나누면 구간당 몇 분일까요?",
    ],
  },
  siblings: {
    "+": [
      "남매 챌린지에서 형이 {a}점, 동생이 {b}점을 얻었어요. 팀 점수는?",
      "브이로그 촬영 소품 {a}개에 {b}개를 더 샀어요. 총 몇 개일까요?",
      "오늘 미션에서 {a}개 성공하고 추가로 {b}개 성공했어요. 합계는?",
      "간식 상자에 젤리 {a}개, 사탕 {b}개를 넣었어요. 총 몇 개?",
      "응원 댓글 {a}개에 {b}개가 더 달렸어요. 모두 몇 개인가요?",
    ],
    "-": [
      "간식 {a}개 중 동생이 {b}개 먹었어요. 남은 간식은?",
      "촬영 소품 {a}개 중 {b}개를 정리했어요. 남은 개수는?",
      "미션 점수 {a}점에서 실수로 {b}점을 잃었어요. 현재 점수는?",
      "스티커 {a}장 중 {b}장을 친구에게 줬어요. 남은 장수는?",
      "게임 코인 {a}개 중 {b}개를 사용했어요. 잔여 코인은?",
    ],
    "×": [
      "남매가 한 라운드에 {a}개씩, {b}라운드를 완료했어요. 총 몇 개?",
      "영상 컷마다 {a}초, {b}컷을 찍었어요. 총 몇 초일까요?",
      "한 봉지에 젤리 {a}개, {b}봉지를 준비했어요. 합계는?",
      "챌린지 세트 하나에 {a}개 준비물, {b}세트면 총 몇 개?",
      "한 줄에 {a}명씩 {b}줄 응원단이 섰어요. 총 몇 명?",
    ],
    "÷": [
      "남매가 모은 스티커 {a}장을 {b}명에게 똑같이 나누면 1명당 몇 장?",
      "획득 코인 {a}개를 {b}라운드에 똑같이 나누면 라운드당 몇 개?",
      "{a}개의 젤리를 {b}봉지에 같은 수로 담으면 봉지당 몇 개?",
      "챌린지 점수 {a}점을 {b}단계로 나누면 단계당 몇 점?",
      "{a}개의 응원카드를 {b}팀에 나누면 팀당 몇 개일까요?",
    ],
  },
  blockworld: {
    "+": [
      "블록월드에서 코인 {a}개를 모으고 {b}개를 더 얻었어요. 총 코인은?",
      "인벤토리에 블록 {a}개와 {b}개가 있어요. 합계는?",
      "퀘스트 보상 {a}개에 보너스 {b}개를 받았어요. 총 몇 개인가요?",
      "한 맵에서 {a}점을 얻고 다음 맵에서 {b}점을 얻었어요. 합계 점수는?",
      "팀원이 자원 {a}개, 내가 {b}개를 모았어요. 총 자원은?",
    ],
    "-": [
      "코인 {a}개 중 상점에서 {b}개를 썼어요. 남은 코인은?",
      "내구도 {a}에서 {b}만큼 줄었어요. 현재 내구도는?",
      "블록 {a}개 중 {b}개를 설치했어요. 남은 블록은?",
      "경험치 {a}에서 패널티 {b}가 적용됐어요. 남은 경험치는?",
      "아이템 {a}개 중 {b}개를 교환했어요. 인벤토리 잔량은?",
    ],
    "×": [
      "상자 하나에 블록 {a}개, {b}상자를 채우면 총 몇 개?",
      "웨이브마다 몬스터 {a}마리, {b}웨이브면 총 몇 마리?",
      "점프 패드 한 줄에 {a}개, {b}줄 설치했어요. 전체 개수는?",
      "한 단계당 코인 {a}개씩 {b}단계를 클리어하면 총 몇 개?",
      "팀 {a}개가 각각 {b}점씩 얻었어요. 총 점수는?",
    ],
    "÷": [
      "코인 {a}개를 파티 {b}명에게 똑같이 나누면 1명당 몇 개?",
      "블록 {a}개를 {b}칸에 똑같이 채우면 칸당 몇 개?",
      "총 점수 {a}점을 {b}라운드로 나누면 라운드당 몇 점?",
      "자원 {a}개를 창고 {b}개에 나누면 창고당 몇 개?",
      "{a}초를 {b}구간으로 나누면 구간당 몇 초일까요?",
    ],
  },
};

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
  const [theme, setTheme] = useState<ThemeMode>("default");
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
  const questionStory = useMemo(() => {
    const templates = THEME_STORIES[theme][question.op];
    const picked = templates[Math.floor(Math.random() * templates.length)] ?? "{a} ? {b}";
    return picked
      .replaceAll("{a}", String(question.a))
      .replaceAll("{b}", String(question.b));
  }, [theme, question]);
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
        <div className={styles.themeSelector}>
          {(Object.keys(THEME_LABEL) as ThemeMode[]).map((mode) => (
            <button
              key={mode}
              type="button"
              className={`${styles.themeBtn} ${theme === mode ? styles.themeBtnActive : ""}`}
              onClick={() => setTheme(mode)}
            >
              {THEME_LABEL[mode]}
            </button>
          ))}
        </div>

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
          <p className={styles.storyText}>{questionStory}</p>
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
