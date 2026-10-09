"use client";

import PlayChoiceGame, { type ChoiceRound } from "@/components/play/PlayChoiceGame";

const ROUNDS: ChoiceRound[] = [
  { emoji: "🐶", prompt: "그림 속 낱말을 찾아요.", question: "‘강아지’를 뜻하는 낱말은 무엇일까요?", choices: ["고양이", "강아지", "토끼", "사자"], answer: 1, explanation: "멍멍 짖는 동물은 강아지예요." },
  { emoji: "🌧️", prompt: "비 오는 날의 표현이에요.", question: "‘하늘에서 물방울이 내려요’와 가장 가까운 말은?", choices: ["눈이 와요", "비가 와요", "바람이 불어요", "해가 떠요"], answer: 1, explanation: "물방울이 내리는 날은 비가 오는 날이에요." },
  { emoji: "🍉", prompt: "낱말의 첫소리를 맞혀요.", question: "‘수박’의 첫소리는 무엇일까요?", choices: ["ㅅ", "ㅂ", "ㅈ", "ㅁ"], answer: 0, explanation: "수박은 ‘ㅅ’ 소리로 시작해요." },
  { emoji: "🚲", prompt: "문장을 완성해요.", question: "자전거를 탈 때 머리에 쓰는 것은?", choices: ["장갑", "헬멧", "양말", "앞치마"], answer: 1, explanation: "안전을 위해 헬멧을 써요." },
  { emoji: "🌳", prompt: "반대말 탐험을 떠나요.", question: "‘크다’의 반대말은 무엇일까요?", choices: ["길다", "작다", "높다", "빠르다"], answer: 1, explanation: "크다의 반대말은 작다예요." },
];

export default function WordsPage() { return <PlayChoiceGame title="낱말 탐험" eyebrow="WORD EXPLORER" intro="그림과 이야기를 단서로 재미있게 낱말을 찾아보세요." gameType="word_explorer" rounds={ROUNDS} completeTitle="낱말 탐험 완료!" completeDescription="오늘의 어휘 탐험 기록이 저장되었어요." />; }
