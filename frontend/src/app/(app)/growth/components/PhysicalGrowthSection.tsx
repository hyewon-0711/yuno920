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

function displayMemo(m: string | null | undefined): string | null {
  const t = m?.trim();
  return t ? t : null;
}

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
  const [formError, setFormError] = useState("");

  const physicalRows = data
    .filter((r) => r.height != null || r.weight != null)
    .sort((a, b) => a.recorded_at.localeCompare(b.recorded_at));

  const chartData = physicalRows.map((r) => ({
    date: r.recorded_at,
    height: r.height ? Number(r.height) : null,
    weight: r.weight ? Number(r.weight) : null,
    memo: displayMemo(r.memo) ?? "",
  }));

  const latest = [...physicalRows].sort((a, b) => b.recorded_at.localeCompare(a.recorded_at))[0];
  const latestMemo = latest ? displayMemo(latest.memo) : null;

  const entriesDesc = [...physicalRows].sort((a, b) => b.recorded_at.localeCompare(a.recorded_at));

  const handleSave = async () => {
    setFormError("");
    const h = parseFloat(height);
    const w = parseFloat(weight);
    if (isNaN(h) || isNaN(w) || h < 50 || h > 200 || w < 0.5 || w > 100) {
      setFormError("키는 50~200cm, 몸무게는 0.5~100kg 범위로 입력해주세요");
      return;
    }
    setSaving(true);
    try {
      await onAdd(h, w, recordedAt, memo || undefined);
      setShowModal(false);
      setHeight("");
      setWeight("");
      setMemo("");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "저장에 실패했습니다";
      setFormError(msg);
    } finally {
      setSaving(false);
    }
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
            <div className={styles.summaryBlock}>
              <div className={styles.summary}>
                <span>{latest.height}cm</span>
                <span>{latest.weight}kg</span>
              </div>
              {latestMemo && <p className={styles.latestMemo}>{latestMemo}</p>}
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
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null;
                      const d = payload[0].payload as { date: string; height: number | null; weight: number | null; memo: string };
                      return (
                        <div
                          style={{
                            background: "var(--bg-card)",
                            borderRadius: "var(--radius-md)",
                            padding: "8px 10px",
                            border: "1px solid var(--border-light)",
                            fontSize: 13,
                            maxWidth: 280,
                          }}
                        >
                          <div style={{ fontWeight: 600, marginBottom: 4 }}>{d.date}</div>
                          {d.height != null && <div>{d.height}cm</div>}
                          {d.weight != null && <div>{d.weight}kg</div>}
                          {d.memo ? <div style={{ marginTop: 6, color: "var(--text-secondary)", whiteSpace: "pre-wrap" }}>{d.memo}</div> : null}
                        </div>
                      );
                    }}
                  />
                  <Legend />
                  <Line yAxisId="left" type="monotone" dataKey="height" name="키(cm)" stroke="var(--tab-growth)" strokeWidth={2} dot={{ r: 4 }} />
                  <Line yAxisId="right" type="monotone" dataKey="weight" name="몸무게(kg)" stroke="var(--tab-record)" strokeWidth={2} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className={styles.hintWrap}>
              <p className={styles.hint}>기록을 더 추가하면 변화 추이를 볼 수 있어요</p>
              {latestMemo && <p className={styles.hintMemo}>{latestMemo}</p>}
            </div>
          )}

          {entriesDesc.length > 0 && (
            <div className={styles.entries}>
              <p className={styles.entriesTitle}>기록 목록</p>
              <ul className={styles.entryList}>
                {entriesDesc.map((r) => {
                  const m = displayMemo(r.memo);
                  return (
                    <li key={r.id} className={styles.entryItem}>
                      <div className={styles.entryMeta}>
                        <span className={styles.entryDate}>{r.recorded_at}</span>
                        <span>
                          {r.height}cm · {r.weight}kg
                        </span>
                      </div>
                      {m && <p className={styles.entryMemo}>{m}</p>}
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </>
      )}

      {showModal && (
        <Modal
          title="신체 성장 기록"
          onClose={() => {
            setShowModal(false);
            setFormError("");
          }}
        >
          <form
            className={styles.form}
            onSubmit={(e) => {
              e.preventDefault();
              void handleSave();
            }}
          >
            <Input
              label="키 (cm)"
              type="number"
              inputMode="decimal"
              value={height}
              onChange={(e) => setHeight(e.target.value)}
              placeholder="50~200"
            />
            <Input
              label="몸무게 (kg)"
              type="number"
              inputMode="decimal"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              placeholder="0.5~100 (신생아 가능)"
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
            {formError && <p className={styles.formError}>{formError}</p>}
            <Button type="submit" loading={saving} disabled={!height.trim() || !weight.trim()} fullWidth>
              저장
            </Button>
          </form>
        </Modal>
      )}
    </section>
  );
}
