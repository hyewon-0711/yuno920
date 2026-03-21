"use client";

import { useEffect, useState } from "react";
import styles from "./CelebrationOverlay.module.css";

interface CelebrationOverlayProps {
  show: boolean;
  onComplete?: () => void;
  duration?: number;
  message?: string;
}

const COLORS = ["#F97316", "#8B5CF6", "#10B981", "#F59E0B", "#EF4444", "#3B82F6"];
const PARTICLE_COUNT = 48;

function createParticles() {
  return Array.from({ length: PARTICLE_COUNT }, (_, i) => {
    const angle = (360 / PARTICLE_COUNT) * i + Math.random() * 15;
    const rad = (angle * Math.PI) / 180;
    const dist = 120 + Math.random() * 80;
    return {
      id: i,
      color: COLORS[i % COLORS.length],
      delay: Math.random() * 200,
      x: Math.cos(rad) * dist,
      y: Math.sin(rad) * dist,
      size: 6 + Math.random() * 8,
    };
  });
}

export default function CelebrationOverlay({
  show,
  onComplete,
  duration = 2500,
  message = "🎉 레벨 업! 🎉",
}: CelebrationOverlayProps) {
  const [visible, setVisible] = useState(false);
  const [particles] = useState(createParticles);

  useEffect(() => {
    if (show) {
      setVisible(true);
      const t = setTimeout(() => {
        setVisible(false);
        onComplete?.();
      }, duration);
      return () => clearTimeout(t);
    }
  }, [show, duration, onComplete]);

  if (!show && !visible) return null;

  return (
    <div className={styles.overlay}>
      <div className={styles.burst}>
        {particles.map((p) => (
          <div
            key={p.id}
            className={styles.particle}
            style={{
              background: p.color,
              width: p.size,
              height: p.size,
              animationDelay: `${p.delay}ms`,
              ["--tx" as string]: `${p.x}px`,
              ["--ty" as string]: `${p.y}px`,
            }}
          />
        ))}
      </div>
      <div className={styles.text}>{message}</div>
    </div>
  );
}
