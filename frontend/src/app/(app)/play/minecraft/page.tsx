"use client";

import { useMemo, useState } from "react";
import AppHeader from "@/components/layout/AppHeader";
import CelebrationOverlay from "@/components/ui/CelebrationOverlay";
import styles from "./page.module.css";

type Difficulty = "easy" | "normal" | "hard";
type Phase = "start" | "quiz" | "result";

interface Question {
  difficulty: Difficulty;
  question: string;
  options: string[];
  answer: number;
  explanation: string;
}

const QUESTION_COUNT = 10;

const QUESTIONS: Question[] = [
  { difficulty: "easy", question: "밤에 나타나 가까이 오면 폭발하는 몬스터는?", options: ["좀비", "크리퍼", "거미", "슬라임"], answer: 1, explanation: "크리퍼는 조용히 다가와 폭발하니 쉭쉭 소리가 들리면 피해야 해요." },
  { difficulty: "easy", question: "나무 원목으로 가장 먼저 만들 수 있는 기본 재료는?", options: ["유리", "철괴", "나무 판자", "벽돌"], answer: 2, explanation: "원목 하나를 제작 칸에 놓으면 나무 판자 4개를 만들 수 있어요." },
  { difficulty: "easy", question: "양에게서 얻어 침대를 만들 때 사용하는 재료는?", options: ["가죽", "깃털", "양털", "실"], answer: 2, explanation: "침대는 같은 색 양털 3개와 나무 판자 3개로 만들어요." },
  { difficulty: "easy", question: "석탄과 막대기를 조합해서 만드는 것은?", options: ["횃불", "화로", "상자", "방패"], answer: 0, explanation: "석탄 또는 목탄과 막대기를 조합하면 횃불 4개가 만들어져요." },
  { difficulty: "easy", question: "물을 담아 옮길 때 필요한 도구는?", options: ["그릇", "가마솥", "양동이", "유리병"], answer: 2, explanation: "빈 양동이를 물 근원에 사용하면 물 양동이가 돼요." },
  { difficulty: "easy", question: "오버월드에서 해가 지면 찾아오는 시간은?", options: ["아침", "낮", "밤", "정오"], answer: 2, explanation: "밤에는 적대적인 몬스터가 많이 생성되므로 밝기를 확보하는 게 좋아요." },
  { difficulty: "easy", question: "작업대를 만들 때 필요한 나무 판자는 몇 개일까?", options: ["2개", "3개", "4개", "8개"], answer: 2, explanation: "제작 칸 네 칸을 나무 판자로 채우면 작업대 하나를 만들 수 있어요." },
  { difficulty: "easy", question: "돼지가 좋아해서 번식시킬 때 줄 수 있는 음식은?", options: ["당근", "밀", "씨앗", "생선"], answer: 0, explanation: "돼지에게 당근, 감자 또는 비트 뿌리를 주면 번식할 수 있어요." },
  { difficulty: "easy", question: "모래를 화로에 구우면 어떤 블록이 될까?", options: ["돌", "유리", "벽돌", "테라코타"], answer: 1, explanation: "모래를 화로에서 제련하면 투명한 유리 블록이 돼요." },
  { difficulty: "easy", question: "플레이어의 시작 지점을 바꾸고 밤을 건너뛰게 해주는 것은?", options: ["상자", "침대", "책장", "모루"], answer: 1, explanation: "오버월드에서 침대에 누우면 시작 지점이 저장되고 밤을 건너뛸 수 있어요." },
  { difficulty: "normal", question: "다이아몬드 원석을 캐는 데 사용할 수 없는 곡괭이는?", options: ["철 곡괭이", "다이아몬드 곡괭이", "네더라이트 곡괭이", "돌 곡괭이"], answer: 3, explanation: "다이아몬드 원석은 철 등급 이상의 곡괭이로 캐야 아이템을 얻어요." },
  { difficulty: "normal", question: "네더 포털의 틀을 만드는 블록은?", options: ["흑요석", "석탄 블록", "검은색 콘크리트", "기반암"], answer: 0, explanation: "흑요석으로 직사각형 틀을 만든 뒤 부싯돌과 부시로 내부에 불을 붙여요." },
  { difficulty: "normal", question: "주민과 거래할 때 주로 사용하는 화폐는?", options: ["다이아몬드", "금괴", "에메랄드", "청금석"], answer: 2, explanation: "주민은 대부분 에메랄드를 받고 다양한 물건을 거래해요." },
  { difficulty: "normal", question: "엔더 진주와 블레이즈 가루를 조합하면 무엇이 될까?", options: ["엔더의 눈", "마그마 크림", "화염구", "경험치 병"], answer: 0, explanation: "엔더의 눈은 요새를 찾거나 엔드 포털을 활성화할 때 사용해요." },
  { difficulty: "normal", question: "마법 부여대를 만드는 데 필요하지 않은 재료는?", options: ["책", "다이아몬드", "흑요석", "레드스톤"], answer: 3, explanation: "마법 부여대에는 책 1개, 다이아몬드 2개, 흑요석 4개가 필요해요." },
  { difficulty: "normal", question: "길들인 늑대에게 먹여 체력을 회복시키는 음식은?", options: ["밀", "고기", "당근", "사과"], answer: 1, explanation: "길들인 늑대는 여러 종류의 고기를 먹으면 체력을 회복해요." },
  { difficulty: "hard", question: "신호기의 가장 아래 단계 피라미드에 필요한 최소 광물 블록 수는?", options: ["9개", "16개", "25개", "36개"], answer: 0, explanation: "신호기 아래에 3×3 크기로 광물 블록 9개를 놓으면 1단계가 활성화돼요." },
  { difficulty: "hard", question: "네더라이트 주괴 하나를 만드는 데 필요한 네더라이트 파편 수는?", options: ["2개", "3개", "4개", "8개"], answer: 2, explanation: "네더라이트 파편 4개와 금괴 4개를 조합해 네더라이트 주괴를 만들어요." },
  { difficulty: "hard", question: "엔드에서 셜커가 발사한 탄환에 맞으면 생기는 효과는?", options: ["독", "구속", "공중 부양", "실명"], answer: 2, explanation: "셜커 탄환은 플레이어에게 공중 부양 효과를 줘 낙하 피해를 조심해야 해요." },
  { difficulty: "hard", question: "바다의 심장을 중심으로 앵무조개 껍데기 8개를 조합하면?", options: ["전달체", "복구 나침반", "엔드 수정", "피뢰침"], answer: 0, explanation: "전달체는 프리즈머린 구조물 안에서 활성화하면 수중 활동을 도와줘요." },
  { difficulty: "hard", question: "위더를 소환할 때 필요한 위더 스켈레톤 해골은 몇 개일까?", options: ["2개", "3개", "4개", "5개"], answer: 1, explanation: "영혼 모래 또는 영혼 흙 4개와 위더 스켈레톤 해골 3개가 필요해요." },
  { difficulty: "hard", question: "엔더 드래곤을 다시 소환하려면 출구 포털에 무엇을 놓아야 할까?", options: ["엔더의 눈 4개", "엔드 수정 4개", "용의 숨결 4개", "네더의 별 4개"], answer: 1, explanation: "출구 포털 네 변에 엔드 수정 4개를 놓으면 엔더 드래곤이 다시 나타나요." },
];

const DIFFICULTIES: { id: Difficulty; label: string; description: string; icon: string }[] = [
  { id: "easy", label: "평화로움", description: "처음 시작하는 탐험가", icon: "🌱" },
  { id: "normal", label: "보통", description: "제법 노련한 모험가", icon: "⚔️" },
  { id: "hard", label: "어려움", description: "마인크래프트 박사", icon: "🐉" },
];

function shuffle<T>(items: T[]) {
  return [...items].sort(() => Math.random() - 0.5);
}

export default function MinecraftQuizPage() {
  const [phase, setPhase] = useState<Phase>("start");
  const [difficulty, setDifficulty] = useState<Difficulty>("easy");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [showCelebration, setShowCelebration] = useState(false);

  const current = questions[index];
  const progress = questions.length ? ((index + 1) / questions.length) * 100 : 0;
  const resultMessage = useMemo(() => {
    if (score === QUESTION_COUNT) return "완벽해요! 엔더 드래곤도 놀랐겠어요!";
    if (score >= 7) return "훌륭한 모험가예요! 조금만 더 도전해 봐요.";
    if (score >= 4) return "좋은 출발이에요! 해설을 보고 다시 도전해 봐요.";
    return "괜찮아요! 모든 고수도 첫날은 나무부터 캤답니다.";
  }, [score]);

  const startGame = (level = difficulty) => {
    const allowed = QUESTIONS.filter((q) => {
      if (level === "easy") return q.difficulty === "easy";
      if (level === "normal") return q.difficulty !== "hard";
      return true;
    });
    const picked = shuffle(allowed);
    while (picked.length < QUESTION_COUNT) picked.push(...shuffle(allowed));
    setDifficulty(level);
    setQuestions(picked.slice(0, QUESTION_COUNT));
    setIndex(0);
    setSelected(null);
    setScore(0);
    setPhase("quiz");
  };

  const chooseAnswer = (answer: number) => {
    if (selected !== null) return;
    setSelected(answer);
    if (answer === current.answer) setScore((value) => value + 1);
  };

  const goNext = () => {
    if (index < questions.length - 1) {
      setIndex((value) => value + 1);
      setSelected(null);
      return;
    }
    const finalScore = score;
    setPhase("result");
    if (finalScore >= 8) setShowCelebration(true);
  };

  return (
    <>
      <CelebrationOverlay show={showCelebration} onComplete={() => setShowCelebration(false)} message="멋진 탐험이었어요!" />
      <AppHeader title="마인크래프트 퀴즈" showBack backHref="/play" />
      <main className={styles.page}>
        {phase === "start" && (
          <section className={styles.startCard}>
            <div className={styles.heroIcon} aria-hidden="true">⛏️</div>
            <p className={styles.eyebrow}>윤호의 블록 지식 도전</p>
            <h1>난이도를 골라 모험을 시작해요!</h1>
            <p className={styles.description}>10개의 문제를 풀고 마인크래프트 박사에 도전해 보세요.</p>
            <div className={styles.difficultyGrid}>
              {DIFFICULTIES.map((item) => (
                <button key={item.id} type="button" className={`${styles.difficultyButton} ${difficulty === item.id ? styles.active : ""}`} onClick={() => setDifficulty(item.id)} aria-pressed={difficulty === item.id}>
                  <span className={styles.difficultyIcon}>{item.icon}</span>
                  <strong>{item.label}</strong>
                  <small>{item.description}</small>
                </button>
              ))}
            </div>
            <button type="button" className={styles.primaryButton} onClick={() => startGame()}>모험 시작하기</button>
          </section>
        )}

        {phase === "quiz" && current && (
          <section>
            <div className={styles.statusRow}><span>{DIFFICULTIES.find((item) => item.id === difficulty)?.icon} {DIFFICULTIES.find((item) => item.id === difficulty)?.label}</span><strong>{index + 1} / {questions.length}</strong></div>
            <div className={styles.progressTrack}><div className={styles.progressBar} style={{ width: `${progress}%` }} /></div>
            <div className={styles.questionCard}>
              <p className={styles.questionNumber}>문제 {index + 1}</p>
              <h1>{current.question}</h1>
              <div className={styles.options}>
                {current.options.map((option, optionIndex) => {
                  const answered = selected !== null;
                  const className = answered && optionIndex === current.answer ? styles.correct : answered && optionIndex === selected ? styles.wrong : "";
                  return <button key={option} type="button" className={`${styles.option} ${className}`} onClick={() => chooseAnswer(optionIndex)} disabled={answered}><span>{optionIndex + 1}</span>{option}</button>;
                })}
              </div>
              {selected !== null && <div className={`${styles.feedback} ${selected === current.answer ? styles.feedbackCorrect : styles.feedbackWrong}`}><strong>{selected === current.answer ? "정답이에요! 🎉" : "아쉬워요! 정답을 확인해 봐요."}</strong><p>{current.explanation}</p></div>}
            </div>
            {selected !== null && <button type="button" className={styles.primaryButton} onClick={goNext}>{index === questions.length - 1 ? "결과 보기" : "다음 문제"}</button>}
          </section>
        )}

        {phase === "result" && (
          <section className={styles.resultCard}>
            <div className={styles.trophy} aria-hidden="true">🏆</div>
            <p className={styles.eyebrow}>모험 완료</p>
            <h1>{score} / {QUESTION_COUNT} 문제 정답!</h1>
            <p className={styles.resultMessage}>{resultMessage}</p>
            <div className={styles.resultActions}>
              <button type="button" className={styles.primaryButton} onClick={() => startGame(difficulty)}>같은 난이도 다시 하기</button>
              <button type="button" className={styles.secondaryButton} onClick={() => setPhase("start")}>난이도 바꾸기</button>
            </div>
          </section>
        )}
      </main>
    </>
  );
}
