"use client";

import PlayChoiceGame, { type ChoiceRound } from "@/components/play/PlayChoiceGame";

const ROUNDS: ChoiceRound[] = [
  { emoji: "👾", prompt: "몬스터에게 간식을 3개 주었어요.", question: "간식 2개를 더 주면 모두 몇 개일까요?", choices: ["4개", "5개", "6개", "7개"], answer: 1, explanation: "3 + 2 = 5개예요." },
  { emoji: "🍎", prompt: "빨간 사과를 나눠 먹어요.", question: "사과 12개 중 4개를 먹으면 몇 개가 남을까요?", choices: ["6개", "7개", "8개", "9개"], answer: 2, explanation: "12 - 4 = 8개가 남아요." },
  { emoji: "⭐", prompt: "몬스터가 별 조각을 모으고 있어요.", question: "별 조각 4개씩 3묶음이면 모두 몇 개일까요?", choices: ["7개", "10개", "12개", "14개"], answer: 2, explanation: "4 × 3 = 12개예요." },
  { emoji: "🎁", prompt: "선물 상자를 친구들에게 똑같이 나눠요.", question: "선물 10개를 2명에게 똑같이 나누면 한 명당 몇 개일까요?", choices: ["3개", "4개", "5개", "6개"], answer: 2, explanation: "10 ÷ 2 = 5개예요." },
  { emoji: "🚀", prompt: "마지막으로 로켓 연료를 계산해요.", question: "연료 7통에 6통을 더 채우면 모두 몇 통일까요?", choices: ["11통", "12통", "13통", "14통"], answer: 2, explanation: "7 + 6 = 13통이에요." },
];

export default function MonsterPage() { return <PlayChoiceGame title="몬스터 키우기 수학" eyebrow="MONSTER MATH" intro="문제를 풀고 몬스터에게 먹이를 주며 함께 성장해보세요." gameType="monster_math" rounds={ROUNDS} completeTitle="몬스터가 쑥쑥 자랐어요!" completeDescription="오늘의 수학 먹이 주기 기록이 저장되었어요." />; }
