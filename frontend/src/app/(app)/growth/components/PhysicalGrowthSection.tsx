"use client";

import { useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Button, Input } from "@/components/ui";
import Modal from "@/components/ui/Modal";
import EmptyState from "@/components/ui/EmptyState";
import type { GrowthMetric } from "@/hooks/useGrowthMetrics";
import styles from "./PhysicalGrowthSection.module.css";

interface Props {
  data: GrowthMetric[];
  loading: boolean;
  onAdd: (height: number, weight: number, recordedAt: string, memo?: string) => Promise<void>;
}

export default function PhysicalGrowthSection({ data, loading, onAdd }: Props) {
  const [showModal, setShowModal] = useState(false);
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [recordedAt, setRecordedAt] = useState(new Date().toISOString().split("T")[0]);
  const [memo, setMemo] = useState("");
  const [saving, setSaving] = useState(false);

  const chartData = data
    .filter((r) => r.height != null || r.weight != null)
    .map((r) => ({
      date: r.recorded_at,
      height: r.height ? Number(r.height) : null,
      weight: r.weight ? Number(r.weight) : null,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));

  const latest = data.filter((r) => r.height != null || r.weight != null).sort(
    (a, b) => b.recorded_at.localeCompare(a.recorded_at)
  )[0];

  const handleSave = async () => {
    const h = parseFloat(height);
    const w = parseFloat(weight);
    if (isNaN(h) || isNaN(w) || h < 50 || h > 200 || w < 5 || w > 100) {
      alert("키는 50~200cm, 몸무게는 5~100kg 범위로 입력해주세요");
      return;
    }
    setSaving(true);
    await onAdd(h, w, recordedAt, memo || undefined);
    setShowModal(false);
    setHeight("");
    setWeight("");
    setMemo("");
    setSaving(false);
  };

  return (
    <section className={styles.section}>
      <div className={styles.header}>
        <h3 className={styles.title}>📏 신체 성장</h3>
        <Button variant="ghost" size="small" onClick={() => setShowModal(true)}>
          + 입력
        </Button>
      </div>

      {loading ? (
        <p className={styles.loading}>불러오는 중...</p>
      ) : chartData.length === 0 ? (
        <EmptyState
          icon="📏"
          title="아이의 키와 몸무게를 기록해보세요"
          description="기록을 추가하면 성장 추이를 확인할 수 있어요"
          action={<Button onClick={() => setShowModal(true)}>첫 기록 추가</Button>}
        />
      ) : (
        <>
          {latest && (
            <div className={styles.summary}>
              <span>키 {latest.height}cm</span>
              <span>몸무게 {latest.weight}kg</span>
            </div>
          )}
          {chartData.length >= 2 ? (
            <div className={styles.chart}>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="var(--text-tertiary)" />
                  <YAxis yAxisId="left" tick={{ fontSize: 11 }} stroke="var(--tab-growth)" />
                  <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} stroke="var(--tab-record)" />
                  <Tooltip
                    contentStyle={{ background: "var(--bg-card)", borderRadius: "var(--radius-md)" }}
                  />
                  <Legend />
                  <Line yAxisId="left" type="monotone" dataKey="height" name="키(cm)" stroke="var(--tab-growth)" strokeWidth={2} dot={{ r: 4 }} />
                  <Line yAxisId="right" type="monotone" dataKey="weight" name="몸무게(kg)" stroke="var(--tab-record)" strokeWidth={2} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className={styles.hint}>기록을 더 추가하면 변화 추이를 볼 수 있어요</p>
          )}
        </>
      )}

      {showModal && (
        <Modal title="신체 성장 기록" onClose={() => setShowModal(false)}>
          <div className={styles.form}>
            <Input
              label="키 (cm)"
              type="number"
              value={height}
              onChange={(e) => setHeight(e.target.value)}
              placeholder="50~200"
            />
            <Input
              label="몸무게 (kg)"
              type="number"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              placeholder="5~100"
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
              placeholder="병원 방문 등"
            />
            <Button onClick={handleSave} loading={saving} disabled={!height || !weight}>
              저장
            </Button>
          </div>
        </Modal>
      )}
    </section>
  );
}
