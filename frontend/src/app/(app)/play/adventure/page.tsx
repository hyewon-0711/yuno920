"use client";

import PlayChoiceGame, { type ChoiceRound } from "@/components/play/PlayChoiceGame";

const ROUNDS: ChoiceRound[] = [
  { emoji: "🗺️", prompt: "보물섬으로 가는 첫 번째 길이에요.", question: "나침반의 빨간 바늘이 가리키는 방향은?", choices: ["북쪽", "남쪽", "동쪽", "서쪽"], answer: 0, explanation: "나침반의 빨간 바늘은 보통 북쪽을 가리켜요." },
  { emoji: "🌉", prompt: "강을 건너야 보물섬에 도착할 수 있어요.", question: "다리가 3개 있고, 다리마다 깃발이 2개라면 깃발은 모두 몇 개일까요?", choices: ["5개", "6개", "7개", "8개"], answer: 1, explanation: "3 × 2 = 6개예요." },
  { emoji: "🦉", prompt: "부엉이가 비밀 쪽지를 가져왔어요.", question: "밤에 더 잘 활동하는 동물은 무엇일까요?", choices: ["부엉이", "참새", "나비", "닭"], answer: 0, explanation: "부엉이는 어두운 밤에도 잘 볼 수 있어요." },
  { emoji: "🧭", prompt: "갈림길에서 현명한 선택을 해볼까요?", question: "지도를 읽을 때 가장 먼저 확인하면 좋은 것은?", choices: ["색깔", "제목과 기호", "종이 크기", "접힌 횟수"], answer: 1, explanation: "제목과 기호를 보면 지도에 무엇이 표시됐는지 알 수 있어요." },
  { emoji: "💎", prompt: "드디어 보물상자 앞에 도착했어요!", question: "친구와 함께 보물을 발견했을 때 가장 좋은 행동은?", choices: ["혼자 숨기기", "친구와 함께 나누기", "아무에게도 말하지 않기", "상자를 닫아두기"], answer: 1, explanation: "함께한 친구와 기쁨을 나누면 모험이 더 즐거워져요." },
];

export default function AdventurePage() { return <PlayChoiceGame title="보물섬 탐험" eyebrow="ADVENTURE MAP" intro="지도와 문제를 풀며 보물섬의 비밀을 찾아보세요." gameType="adventure" rounds={ROUNDS} completeTitle="보물섬 탐험 완료!" completeDescription="오늘의 탐험 기록이 저장되었어요." />; }
