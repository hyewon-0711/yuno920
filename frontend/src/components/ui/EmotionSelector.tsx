"use client";

import styles from "./EmotionSelector.module.css";

export type Mood = "happy" | "neutral" | "sad" | "sick" | "tired";

interface EmotionOption {
  value: Mood;
  emoji: string;
  label: string;
  bg: string;
}

const emotions: EmotionOption[] = [
  { value: "happy", emoji: "😊", label: "좋음", bg: "var(--emotion-happy-bg)" },
  { value: "neutral", emoji: "😐", label: "보통", bg: "var(--emotion-neutral-bg)" },
  { value: "sad", emoji: "😢", label: "안좋음", bg: "var(--emotion-sad-bg)" },
  { value: "sick", emoji: "🤒", label: "아픔", bg: "var(--emotion-sick-bg)" },
  { value: "tired", emoji: "😴", label: "피곤", bg: "var(--emotion-tired-bg)" },
];

interface EmotionSelectorProps {
  value?: Mood;
  onChange: (mood: Mood) => void;
}

export default function EmotionSelector({ value, onChange }: EmotionSelectorProps) {
  return (
    <div className={styles.row}>
      {emotions.map((e) => {
        const isActive = value === e.value;
        return (
          <button
            key={e.value}
            type="button"
            className={[styles.item, isActive ? styles.active : ""].join(" ")}
            style={isActive ? { background: e.bg } : undefined}
            onClick={() => onChange(e.value)}
          >
            <span className={styles.emoji}>{e.emoji}</span>
            <span className={styles.label}>{e.label}</span>
          </button>
        );
      })}
    </div>
  );
}
