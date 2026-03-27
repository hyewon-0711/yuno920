"use client";

import { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Button, Input } from "@/components/ui";
import Modal from "@/components/ui/Modal";
import EmptyState from "@/components/ui/EmptyState";
import type { GrowthMetric } from "@/hooks/useGrowthMetrics";
import styles from "./LearningSection.module.css";

function displayMemo(m: string | null | undefined): string | null {
  const t = m?.trim();
  return t ? t : null;
}

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
  const [formError, setFormError] = useState("");

  const learningRows = data
    .filter((r) => r.sr_score != null)
    .sort((a, b) => a.recorded_at.localeCompare(b.recorded_at));

  const chartData = learningRows
    .map((r) => ({
      date: r.recorded_at,
      score: Number(r.sr_score),
      memo: displayMemo(r.memo) ?? "",
    }))
    .slice(-10);

  const latest = [...learningRows].sort((a, b) => b.recorded_at.localeCompare(a.recorded_at))[0];
  const latestMemo = latest ? displayMemo(latest.memo) : null;

  const entriesDesc = [...learningRows].sort((a, b) => b.recorded_at.localeCompare(a.recorded_at));

  const handleSave = async () => {
    setFormError("");
    const s = parseInt(srScore, 10);
    if (isNaN(s) || s < 0 || s > 100) {
      setFormError("학습 점수는 0~100 범위로 입력해주세요");
      return;
    }
    setSaving(true);
    try {
      await onAdd(s, recordedAt, memo || undefined);
      setShowModal(false);
      setSrScore("");
      setMemo("");
    } catch (e) {
      setFormError(e instanceof Error ? e.message : "저장에 실패했습니다");
    } finally {
      setSaving(false);
    }
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
            <div className={styles.summaryBlock}>
              <div className={styles.summary}>
                <span>최근: {latest.sr_score}점</span>
                <span className={styles.grade}>{levelLabel(Number(latest.sr_score))}</span>
              </div>
              {latestMemo && <p className={styles.latestMemo}>{latestMemo}</p>}
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
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null;
                      const d = payload[0].payload as { date: string; score: number; memo: string };
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
                          <div>{d.score}점</div>
                          {d.memo ? (
                            <div style={{ marginTop: 6, color: "var(--text-secondary)", whiteSpace: "pre-wrap" }}>{d.memo}</div>
                          ) : null}
                        </div>
                      );
                    }}
                  />
                  <Bar dataKey="score" name="점수" fill="var(--tab-growth)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : null}

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
                          {r.sr_score}점 · {levelLabel(Number(r.sr_score))}
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
          title="학습 점수 기록"
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
              label="학습 점수 (0~100)"
              type="number"
              inputMode="numeric"
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
            {formError && <p className={styles.formError}>{formError}</p>}
            <Button type="submit" loading={saving} disabled={!srScore.trim()} fullWidth>
              저장
            </Button>
          </form>
        </Modal>
      )}
    </section>
  );
}
