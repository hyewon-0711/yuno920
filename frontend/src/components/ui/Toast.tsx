"use client";

import { useEffect } from "react";
import styles from "./Toast.module.css";

type ToastType = "success" | "error" | "info";

interface ToastProps {
  message: string;
  type?: ToastType;
  onClose: () => void;
  duration?: number;
}

const icons: Record<ToastType, string> = {
  success: "✓",
  error: "✕",
  info: "ℹ",
};

export default function Toast({ message, type = "info", onClose, duration = 3000 }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [onClose, duration]);

  return (
    <div className={styles.container}>
      <div className={styles.toast}>
        <span className={[styles.icon, styles[type]].join(" ")}>{icons[type]}</span>
        {message}
      </div>
    </div>
  );
}
