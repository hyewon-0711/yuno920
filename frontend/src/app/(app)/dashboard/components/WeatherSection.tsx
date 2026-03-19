"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import styles from "./WeatherSection.module.css";

interface WeatherData {
  temperature: number;
  description: string;
  icon: string;
}

const dayNames = ["일", "월", "화", "수", "목", "금", "토"];

export default function WeatherSection() {
  const [weather, setWeather] = useState<WeatherData | null>(null);

  const now = new Date();
  const dateStr = `${now.getMonth() + 1}월 ${now.getDate()}일 ${dayNames[now.getDay()]}요일`;

  useEffect(() => {
    api.get<WeatherData>("/api/external/weather")
      .then(setWeather)
      .catch(() => setWeather({ temperature: 0, description: "정보 없음", icon: "❓" }));
  }, []);

  if (!weather) return null;

  return (
    <div className={styles.card}>
      <div className={styles.left}>
        <span className={styles.icon}>{weather.icon}</span>
        <div>
          <div className={styles.temp}>{weather.temperature}°</div>
          <div className={styles.condition}>{weather.description}</div>
        </div>
      </div>
      <div className={styles.right}>
        <div className={styles.date}>{dateStr}</div>
        <span className={`${styles.dustBadge} ${styles.good}`}>미세먼지 좋음</span>
      </div>
    </div>
  );
}
