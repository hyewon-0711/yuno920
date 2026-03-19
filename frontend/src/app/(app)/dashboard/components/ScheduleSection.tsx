"use client";

import { useState } from "react";
import type { Schedule } from "@/hooks/useSchedules";
import styles from "./ScheduleSection.module.css";

interface Props {
  schedules: Schedule[];
  loading: boolean;
  onAdd: (s: { title: string; start_time: string; repeat_type: string }) => Promise<unknown>;
  onDelete: (id: string) => Promise<unknown>;
}

function getStatus(startTime: string, endTime: string | null): "completed" | "ongoing" | "upcoming" {
  const now = new Date();
  const start = new Date(startTime);
  const end = endTime ? new Date(endTime) : null;

  if (end && now > end) return "completed";
  if (now >= start && (!end || now <= end)) return "ongoing";
  if (now < start) return "upcoming";
  if (!end && now > new Date(start.getTime() + 60 * 60 * 1000)) return "completed";
  return "upcoming";
}

function getRemaining(startTime: string): string {
  const now = new Date();
  const start = new Date(startTime);
  const diff = Math.floor((start.getTime() - now.getTime()) / 60000);

  if (diff <= 0) return "";
  if (diff >= 60) return `${Math.floor(diff / 60)}시간 후`;
  return `${diff}분 후`;
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit", hour12: false });
}

export default function ScheduleSection({ schedules, loading, onAdd, onDelete }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [time, setTime] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleAdd = async () => {
    if (!title.trim() || !time) return;
    setSubmitting(true);
    const today = new Date().toISOString().split("T")[0];
    await onAdd({
      title: title.trim(),
      start_time: `${today}T${time}:00`,
      repeat_type: "none",
    });
    setTitle("");
    setTime("");
    setShowForm(false);
    setSubmitting(false);
  };

  return (
    <section>
      <div className={styles.card}>
        <div className={styles.header}>
          <h3 className={styles.sectionTitle}>📅 오늘 일정</h3>
          <button className={styles.addBtn} onClick={() => setShowForm(!showForm)}>
            {showForm ? "취소" : "+ 추가"}
          </button>
        </div>

        {loading ? (
          <p style={{ color: "var(--text-tertiary)", fontSize: 14 }}>불러오는 중...</p>
        ) : schedules.length === 0 ? (
          <p style={{ color: "var(--text-tertiary)", fontSize: 14, textAlign: "center", padding: "var(--space-4) 0" }}>
            오늘 등록된 일정이 없습니다
          </p>
        ) : (
          <div className={styles.list}>
            {schedules.map((s) => {
              const status = getStatus(s.start_time, s.end_time);
              const remaining = getRemaining(s.start_time);
              const dotColor = status === "completed" ? "var(--text-disabled)"
                : status === "ongoing" ? "var(--brand-primary)"
                : "var(--tab-growth)";

              return (
                <div key={s.id} className={styles.item}>
                  <span className={styles.dot} style={{ background: dotColor }} />
                  <div className={styles.info}>
                    <span className={`${styles.time} ${status === "completed" ? styles.timeCompleted : ""}`}>
                      {formatTime(s.start_time)}
                    </span>{" "}
                    <span className={`${styles.title} ${status === "completed" ? styles.titleCompleted : ""}`}>
                      {s.title}
                    </span>
                  </div>
                  {status === "ongoing" && (
                    <span className={`${styles.badge} ${styles.badgeOngoing}`}>진행 중</span>
                  )}
                  {status === "upcoming" && remaining && (
                    <span className={styles.badge}>{remaining}</span>
                  )}
                  <button className={styles.deleteBtn} onClick={() => onDelete(s.id)}>✕</button>
                </div>
              );
            })}
          </div>
        )}

        {showForm && (
          <div className={styles.addForm}>
            <input
              className={styles.formInput}
              placeholder="일정 제목 (예: 태권도)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <div className={styles.row}>
              <input
                className={styles.formInput}
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
              />
              <button className={styles.formBtn} onClick={handleAdd} disabled={submitting || !title || !time}>
                {submitting ? "..." : "추가"}
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
