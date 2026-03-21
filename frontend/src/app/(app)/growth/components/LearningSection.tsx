"use client";

import { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Button, Input } from "@/components/ui";
import Modal from "@/components/ui/Modal";
import EmptyState from "@/components/ui/EmptyState";
import type { GrowthMetric } from "@/hooks/useGrowthMetrics";
import styles from "./LearningSection.module.css";

function levelLabel(score: number): string {
  if (score >= 80) return "우수";
  if (score >= 60) return "양호";
  if (score >= 40) return "보통";
  return "보완 필요";
}

interface Props {
  data: GrowthMetric[];
  loading: boolean;
  onAdd: (srScore: number, recordedAt: string, memo?: string) => Promise<void>;
}

export default function LearningSection({ data, loading, onAdd }: Props) {
  const [showModal, setShowModal] = useState(false);
  const [srScore, setSrScore] = useState("");
  const [recordedAt, setRecordedAt] = useState(new Date().toISOString().split("T")[0]);
  const [memo, setMemo] = useState("");
  const [saving, setSaving] = useState(false);

  const chartData = data
    .filter((r) => r.sr_score != null)
    .map((r) => ({ date: r.recorded_at, score: Number(r.sr_score) }))
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-10);

  const latest = data.filter((r) => r.sr_score != null).sort(
    (a, b) => b.recorded_at.localeCompare(a.recorded_at)
  )[0];

  const handleSave = async () => {
    const s = parseInt(srScore, 10);
    if (isNaN(s) || s < 0 || s > 100) {
      alert("학습 점수는 0~100 범위로 입력해주세요");
      return;
    }
    setSaving(true);
    await onAdd(s, recordedAt, memo || undefined);
    setShowModal(false);
    setSrScore("");
    setMemo("");
    setSaving(false);
  };

  return (
    <section className={styles.section}>
      <div className={styles.header}>
        <h3 className={styles.title}>📊 학습 지표</h3>
        <Button variant="ghost" size="small" onClick={() => setShowModal(true)}>
          + 입력
        </Button>
      </div>

      {loading ? (
        <p className={styles.loading}>불러오는 중...</p>
      ) : chartData.length === 0 ? (
        <EmptyState
          icon="📊"
          title="학습 점수를 기록해보세요"
          description="SR 점수 등을 기록하면 학습 성장을 추적할 수 있어요"
          action={<Button onClick={() => setShowModal(true)}>첫 기록 추가</Button>}
        />
      ) : (
        <>
          {latest && (
            <div className={styles.summary}>
              <span>최근: {latest.sr_score}점</span>
              <span className={styles.grade}>{levelLabel(Number(latest.sr_score))}</span>
            </div>
          )}
          {chartData.length >= 1 ? (
            <div className={styles.chart}>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="var(--text-tertiary)" />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} stroke="var(--text-tertiary)" />
                  <Tooltip
                    contentStyle={{ background: "var(--bg-card)", borderRadius: "var(--radius-md)" }}
                  />
                  <Bar dataKey="score" name="점수" fill="var(--tab-growth)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : null}
        </>
      )}

      {showModal && (
        <Modal title="학습 점수 기록" onClose={() => setShowModal(false)}>
          <div className={styles.form}>
            <Input
              label="학습 점수 (0~100)"
              type="number"
              value={srScore}
              onChange={(e) => setSrScore(e.target.value)}
              placeholder="0~100"
            />
            <Input
              label="측정일"
              type="date"
              value={recordedAt}
              onChange={(e) => setRecordedAt(e.target.value)}
            />
            <Input
              label="메모 (선택)"
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              placeholder="시험 유형 등"
            />
            <Button onClick={handleSave} loading={saving} disabled={!srScore}>
              저장
            </Button>
          </div>
        </Modal>
      )}
    </section>
  );
}
