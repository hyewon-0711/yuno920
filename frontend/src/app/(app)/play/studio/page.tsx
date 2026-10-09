"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import AppHeader from "@/components/layout/AppHeader";
import PageIntro from "@/components/layout/PageIntro";
import { useChild } from "@/hooks/useChild";
import { logPlaySession } from "@/lib/playLogs";
import styles from "./page.module.css";

const COLORS = ["#ffffff", "#f87171", "#fb923c", "#facc15", "#4ade80", "#38bdf8", "#818cf8", "#f472b6", "#334155"];

export default function StudioPage() {
  const { child } = useChild();
  const [selectedColor, setSelectedColor] = useState(COLORS[1]);
  const [pixels, setPixels] = useState(() => Array.from({ length: 64 }, () => COLORS[0]));
  const [saved, setSaved] = useState(false);
  const startedAt = useRef<number | null>(null);
  const coloredCount = useMemo(() => pixels.filter((color) => color !== COLORS[0]).length, [pixels]);

  useEffect(() => {
    startedAt.current = Date.now();
  }, []);

  const paint = (index: number) => {
    setPixels((prev) => prev.map((color, i) => i === index ? selectedColor : color));
    setSaved(false);
  };

  const clear = () => {
    setPixels(Array.from({ length: 64 }, () => COLORS[0]));
    setSaved(false);
  };

  const save = async () => {
    if (!child || coloredCount === 0) return;
    try {
      await logPlaySession({ childId: child.id, gameType: "pixel_studio", score: coloredCount * 5, totalCount: 64, correctCount: coloredCount, startedAt: startedAt.current ?? Date.now() });
      setSaved(true);
    } catch (error) {
      console.error("Failed to save pixel studio log", error);
    }
  };

  return (
    <>
      <AppHeader title="픽셀 아트 스튜디오" showBack backHref="/play" />
      <main className={styles.page}>
        <PageIntro eyebrow="MAKE & CREATE" title="픽셀 아트 스튜디오" description="작은 칸을 색칠해 나만의 캐릭터와 보물을 만들어보세요." />
        <section className={styles.card}>
          <div className={styles.toolbar}><span>색칠한 칸 {coloredCount}</span><button type="button" onClick={clear}>새로 만들기</button></div>
          <div className={styles.palette} aria-label="색상 선택">{COLORS.map((color) => <button key={color} type="button" aria-label={`${color} 색상`} className={`${styles.color} ${selectedColor === color ? styles.colorSelected : ""}`} style={{ backgroundColor: color }} onClick={() => setSelectedColor(color)} />)}</div>
          <div className={styles.canvas} aria-label="픽셀 그림판">{pixels.map((color, index) => <button key={index} type="button" aria-label={`${index + 1}번째 픽셀`} className={styles.pixel} style={{ backgroundColor: color }} onClick={() => paint(index)} />)}</div>
          <button type="button" className={styles.saveButton} onClick={() => void save()} disabled={coloredCount === 0 || saved}>{saved ? "작품 기록 완료" : "작품 기록하기"}</button>
          {saved && <p className={styles.savedMessage}>멋진 작품이 오늘의 놀이 기록에 저장되었어요!</p>}
        </section>
      </main>
    </>
  );
}
