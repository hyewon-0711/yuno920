"use client";

import { useState } from "react";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Button } from "@/components/ui";
import Modal from "@/components/ui/Modal";
import EmptyState from "@/components/ui/EmptyState";
import type { HexagonScores } from "@/hooks/useHexagon";
import styles from "./HexagonSection.module.css";

const KEYS: (keyof HexagonScores)[] = ["learning", "physical", "social", "emotion", "creativity", "habit"];

interface Props {
  scores: HexagonScores | null;
  loading: boolean;
  labels: Record<keyof HexagonScores, string>;
  onCalculateAI: () => Promise<void>;
  onSaveManual: (s: HexagonScores) => Promise<void>;
}

export default function HexagonSection({
  scores,
  loading,
  labels,
  onCalculateAI,
  onSaveManual,
}: Props) {
  const [showModal, setShowModal] = useState(false);
  const [manual, setManual] = useState<HexagonScores>({
    learning: 50,
    physical: 50,
    social: 50,
    emotion: 50,
    creativity: 50,
    habit: 50,
  });
  const [saving, setSaving] = useState(false);

  const chartData = scores
    ? KEYS.map((k) => ({ subject: labels[k], value: scores[k], fullMark: 100 }))
    : [];

  const handleSaveManual = async () => {
    setSaving(true);
    await onSaveManual(manual);
    setShowModal(false);
    setSaving(false);
  };

  return (
    <section className={styles.section}>
      <div className={styles.header}>
        <h3 className={styles.title}>🏆 6각형 인재 분석</h3>
        <div className={styles.actions}>
          <Button variant="ghost" size="small" onClick={onCalculateAI} loading={loading}>
            AI 분석
          </Button>
          <Button variant="ghost" size="small" onClick={() => setShowModal(true)}>
            직접 입력
          </Button>
        </div>
      </div>

      {loading && !scores ? (
        <p className={styles.loading}>불러오는 중...</p>
      ) : chartData.length === 0 ? (
        <EmptyState
          icon="🏆"
          title="6각형 역량을 분석해보세요"
          description="AI 분석으로 자동 산출하거나, 직접 입력할 수 있어요"
          action={
            <div className={styles.btnRow}>
              <Button onClick={onCalculateAI}>AI로 분석</Button>
              <Button variant="secondary" onClick={() => setShowModal(true)}>직접 입력</Button>
            </div>
          }
        />
      ) : (
        <div className={styles.chart}>
          <ResponsiveContainer width="100%" height={260}>
            <RadarChart data={chartData}>
              <PolarGrid stroke="var(--border-default)" />
              <PolarAngleAxis dataKey="subject" tick={{ fontSize: 12 }} />
              <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 10 }} />
              <Radar name="역량" dataKey="value" stroke="var(--tab-growth)" fill="var(--tab-growth)" fillOpacity={0.4} strokeWidth={2} />
              <Legend />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      )}

      {showModal && (
        <Modal title="6각형 역량 직접 입력" onClose={() => setShowModal(false)}>
          <div className={styles.form}>
            {KEYS.map((k) => (
              <div key={k} className={styles.sliderRow}>
                <label>{labels[k]}</label>
                <div className={styles.sliderWrap}>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={manual[k]}
                    onChange={(e) => setManual((p) => ({ ...p, [k]: parseInt(e.target.value, 10) }))}
                  />
                  <span>{manual[k]}</span>
                </div>
              </div>
            ))}
            <Button onClick={handleSaveManual} loading={saving}>
              저장
            </Button>
          </div>
        </Modal>
      )}
    </section>
  );
}
