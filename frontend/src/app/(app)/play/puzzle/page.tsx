"use client";

import PlayChoiceGame, { type ChoiceRound } from "@/components/play/PlayChoiceGame";

const ROUNDS: ChoiceRound[] = [
  { emoji: "🔺", prompt: "도형 조각을 찾아 빈칸을 채워요.", question: "세모 2개를 붙이면 어떤 모양을 만들 수 있을까요?", choices: ["큰 세모", "네모", "동그라미", "별"], answer: 1, explanation: "세모의 변을 맞대면 네모 모양을 만들 수 있어요." },
  { emoji: "🪞", prompt: "거울 나라의 모양 퍼즐이에요.", question: "거울에 비친 글자나 모양은 무엇이 달라질까요?", choices: ["좌우가 바뀌어요", "색만 바뀌어요", "크기만 바뀌어요", "항상 사라져요"], answer: 0, explanation: "거울은 모양의 좌우를 뒤집어 보여줘요." },
  { emoji: "🧩", prompt: "규칙을 찾아 다음 조각을 골라요.", question: "빨강, 파랑, 빨강, 파랑 다음에 올 색은?", choices: ["노랑", "초록", "빨강", "검정"], answer: 2, explanation: "빨강과 파랑이 번갈아 반복되고 있어요." },
  { emoji: "⬛", prompt: "격자판 속 숨은 모양을 찾아요.", question: "정사각형의 변은 몇 개일까요?", choices: ["2개", "3개", "4개", "5개"], answer: 2, explanation: "정사각형은 같은 길이의 변 4개를 가지고 있어요." },
  { emoji: "🌀", prompt: "마지막 미로 퍼즐이에요.", question: "미로를 풀 때 좋은 방법은 무엇일까요?", choices: ["눈을 감기", "막 가기", "갈림길을 관찰하기", "종이를 찢기"], answer: 2, explanation: "갈림길과 막힌 길을 관찰하면 길을 찾기 쉬워요." },
];

export default function PuzzlePage() { return <PlayChoiceGame title="도형 퍼즐 놀이터" eyebrow="SHAPE PUZZLE" intro="도형, 규칙, 대칭을 발견하며 퍼즐 감각을 키워보세요." gameType="shape_puzzle" rounds={ROUNDS} completeTitle="퍼즐 탐정 성공!" completeDescription="오늘 발견한 규칙과 도형 감각이 기록되었어요." />; }
