"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import AppHeader from "@/components/layout/AppHeader";
import { useAuth } from "@/contexts/AuthContext";
import { useChild } from "@/hooks/useChild";
import { api } from "@/lib/api";
import styles from "./page.module.css";

const CATEGORIES = [
  { id: "과학", icon: "🔬", label: "과학" },
  { id: "역사", icon: "📜", label: "역사" },
  { id: "자연", icon: "🌿", label: "자연" },
  { id: "동물", icon: "🐾", label: "동물" },
  { id: "스포츠", icon: "⚽", label: "스포츠" },
  { id: "음식", icon: "🍽️", label: "음식" },
  { id: "한국상식", icon: "🇰🇷", label: "한국 상식" },
  { id: "세계상식", icon: "🌍", label: "세계 상식" },
  { id: "인물", icon: "👤", label: "인물" },
  { id: "문화예술", icon: "🎨", label: "문화·예술" },
];

interface QuizQuestion {
  question: string;
  options: string[];
  answer: number;
  explanation?: string;
}

type Phase = "category" | "loading" | "quiz" | "result";

export default function QuizPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { child, loading: childLoading } = useChild();

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace("/auth/login");
      return;
    }
    if (childLoading) return;
    if (!child) {
      router.replace("/onboarding");
    }
  }, [authLoading, user, childLoading, child, router]);

  if (authLoading || childLoading || !child) {
    return (
      <>
        <AppHeader title="상식 퀴즈" showBack backHref="/play" />
        <div className={styles.page}>
          <p className={styles.loadingText}>불러오는 중...</p>
        </div>
      </>
    );
  }

  const [phase, setPhase] = useState<Phase>("category");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [error, setError] = useState("");

  const startQuiz = async (categoryId: string) => {
    if (!child?.id) {
      setError("아이 프로필이 필요해요");
      return;
    }
    setSelectedCategory(categoryId);
    setPhase("loading");
    setError("");
    try {
      const res = await api.post<{ questions: QuizQuestion[] }>(
        "/api/play/generate-quiz",
        { child_id: child.id, category: categoryId }
      );
      if (res.questions?.length > 0) {
        setQuestions(res.questions);
        setCurrentIndex(0);
        setSelectedAnswer(null);
        setCorrectCount(0);
        setPhase("quiz");
      } else {
        setError("퀴즈를 불러오지 못했어요. 다시 시도해주세요.");
        setPhase("category");
      }
    } catch (err) {
      setError("퀴즈를 불러오지 못했어요. 잠시 후 다시 시도해주세요.");
      setPhase("category");
    }
  };

  const handleAnswer = (idx: number) => {
    if (selectedAnswer !== null) return;
    setSelectedAnswer(idx);
    const isCorrect = idx === questions[currentIndex].answer;
    if (isCorrect) setCorrectCount((c) => c + 1);
  };

  const nextQuestion = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((i) => i + 1);
      setSelectedAnswer(null);
    } else {
      setPhase("result");
    }
  };

  const resetQuiz = () => {
    setPhase("category");
    setSelectedCategory(null);
    setQuestions([]);
  };

  const category = CATEGORIES.find((c) => c.id === selectedCategory);

  return (
    <>
      <AppHeader title="상식 퀴즈" showBack backHref="/play" />
      <div className={styles.page}>
        {phase === "category" && (
          <>
            <p className={styles.intro}>퀴즈를 풀고 싶은 영역을 선택하세요</p>
            {error && <p className={styles.error}>{error}</p>}
            <div className={styles.categoryGrid}>
              {CATEGORIES.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  className={styles.categoryCard}
                  onClick={() => startQuiz(c.id)}
                >
                  <span className={styles.categoryIcon}>{c.icon}</span>
                  <span className={styles.categoryLabel}>{c.label}</span>
                </button>
              ))}
            </div>
          </>
        )}

        {phase === "loading" && (
          <div className={styles.loading}>
            <p>퀴즈를 만들고 있어요...</p>
            <div className={styles.spinner} />
          </div>
        )}

        {phase === "quiz" && questions[currentIndex] && (
          <>
            <div className={styles.progress}>
              {currentIndex + 1} / {questions.length}
            </div>
            <div className={styles.questionCard}>
              <h3 className={styles.question}>{questions[currentIndex].question}</h3>
              <div className={styles.options}>
                {questions[currentIndex].options.map((opt, idx) => {
                  const isSelected = selectedAnswer === idx;
                  const isCorrect = idx === questions[currentIndex].answer;
                  const showResult = selectedAnswer !== null;
                  let btnClass = styles.optionBtn;
                  if (showResult) {
                    if (isCorrect) btnClass += ` ${styles.correct}`;
                    else if (isSelected && !isCorrect) btnClass += ` ${styles.wrong}`;
                  }
                  return (
                    <button
                      key={idx}
                      type="button"
                      className={btnClass}
                      onClick={() => handleAnswer(idx)}
                      disabled={selectedAnswer !== null}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>
              {selectedAnswer !== null && questions[currentIndex].explanation && (
                <p className={styles.explanation}>
                  💡 {questions[currentIndex].explanation}
                </p>
              )}
            </div>
            {selectedAnswer !== null && (
              <button
                type="button"
                className={styles.nextBtn}
                onClick={nextQuestion}
              >
                {currentIndex < questions.length - 1 ? "다음 문제" : "결과 보기"}
              </button>
            )}
          </>
        )}

        {phase === "result" && (
          <div className={styles.resultCard}>
            <h3 className={styles.resultTitle}>
              🎉 퀴즈 완료!
            </h3>
            <p className={styles.resultScore}>
              {correctCount} / {questions.length} 정답
            </p>
            <p className={styles.resultPercent}>
              {Math.round((correctCount / questions.length) * 100)}점
            </p>
            <div className={styles.resultActions}>
              <button type="button" className={styles.resultBtn} onClick={resetQuiz}>
                다른 영역 퀴즈
              </button>
              {category && (
                <button
                  type="button"
                  className={styles.resultBtnPrimary}
                  onClick={() => startQuiz(category.id)}
                >
                  {category.label} 다시 하기
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
