"use client";

import PlayChoiceGame, { type ChoiceRound } from "@/components/play/PlayChoiceGame";

const ROUNDS: ChoiceRound[] = [
  { emoji: "🧲", prompt: "자석 실험실에 들어왔어요.", question: "다음 중 자석에 붙는 물건은 무엇일까요?", choices: ["나무젓가락", "종이컵", "철 클립", "고무공"], answer: 2, explanation: "철처럼 자석에 끌리는 금속은 자석에 붙어요." },
  { emoji: "🪶", prompt: "물에 넣어 보는 실험이에요.", question: "물에 넣었을 때 보통 뜨는 물건은 무엇일까요?", choices: ["쇠구슬", "나무 조각", "돌멩이", "동전"], answer: 1, explanation: "나무는 물보다 가벼워서 물에 뜨는 경우가 많아요." },
  { emoji: "🌱", prompt: "작은 씨앗을 관찰해볼까요?", question: "식물이 자라기 위해 꼭 필요한 것은 무엇일까요?", choices: ["빛과 물", "장난감", "모래시계", "리모컨"], answer: 0, explanation: "식물은 빛과 물을 이용해 건강하게 자라요." },
  { emoji: "🌙", prompt: "우주 관측소에서 밤하늘을 보고 있어요.", question: "달은 스스로 빛을 낼까요?", choices: ["네, 태양처럼요", "아니요, 태양빛을 반사해요", "구름 때문에 빛나요", "밤에만 불이 켜져요"], answer: 1, explanation: "달은 태양빛을 반사해서 밝게 보여요." },
  { emoji: "🔦", prompt: "손전등으로 그림자 실험을 해볼까요?", question: "빛을 물체가 가리면 생기는 것은 무엇일까요?", choices: ["그림자", "무지개", "바람", "소리"], answer: 0, explanation: "빛이 막힌 뒤쪽에 어두운 그림자가 생겨요." },
];

export default function SciencePage() { return <PlayChoiceGame title="과학 실험실" eyebrow="CURIOUS LAB" intro="정답을 맞히기 전에 먼저 관찰하고 생각해보는 과학 놀이예요." gameType="science" rounds={ROUNDS} completeTitle="실험 성공!" completeDescription="호기심으로 알아낸 과학 지식이 기록되었어요." />; }
