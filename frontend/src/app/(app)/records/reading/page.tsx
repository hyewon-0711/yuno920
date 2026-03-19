"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useChild } from "@/hooks/useChild";
import AppHeader from "@/components/layout/AppHeader";
import { Button, Input, EmptyState } from "@/components/ui";
import Modal from "@/components/ui/Modal";
import styles from "./page.module.css";

interface ReadingLog {
  id: string;
  title: string;
  author: string | null;
  duration_minutes: number;
  rating: number | null;
  memo: string | null;
  read_date: string;
}

export default function ReadingPage() {
  const { child } = useChild();
  const [logs, setLogs] = useState<ReadingLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [duration, setDuration] = useState("15");
  const [rating, setRating] = useState(0);
  const [memo, setMemo] = useState("");
  const [readDate, setReadDate] = useState(new Date().toISOString().split("T")[0]);
  const [saving, setSaving] = useState(false);

  const fetchLogs = useCallback(async () => {
    if (!child) return;
    setLoading(true);
    const { data } = await supabase
      .from("reading_logs")
      .select("*")
      .eq("child_id", child.id)
      .order("read_date", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(50);
    if (data) setLogs(data as ReadingLog[]);
    setLoading(false);
  }, [child]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  const resetForm = () => {
    setTitle("");
    setAuthor("");
    setDuration("15");
    setRating(0);
    setMemo("");
    setReadDate(new Date().toISOString().split("T")[0]);
    setEditingId(null);
  };

  const openEdit = (log: ReadingLog) => {
    setTitle(log.title);
    setAuthor(log.author || "");
    setDuration(String(log.duration_minutes));
    setRating(log.rating || 0);
    setMemo(log.memo || "");
    setReadDate(log.read_date);
    setEditingId(log.id);
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!child || !title.trim()) return;
    setSaving(true);

    const payload = {
      child_id: child.id,
      title: title.trim(),
      author: author.trim() || null,
      duration_minutes: parseInt(duration) || 15,
      rating: rating || null,
      memo: memo.trim() || null,
      read_date: readDate,
    };

    if (editingId) {
      await supabase.from("reading_logs").update(payload).eq("id", editingId);
    } else {
      await supabase.from("reading_logs").insert(payload);
    }

    resetForm();
    setShowModal(false);
    fetchLogs();
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("이 독서 기록을 삭제할까요?")) return;
    await supabase.from("reading_logs").delete().eq("id", id);
    fetchLogs();
  };

  const totalBooks = logs.length;
  const totalMinutes = logs.reduce((s, l) => s + l.duration_minutes, 0);

  return (
    <>
      <AppHeader
        title="독서 기록"
        backHref="/records"
        rightAction={
          <button
            onClick={() => { resetForm(); setShowModal(true); }}
            style={{ color: "var(--brand-primary)", fontWeight: 600, fontSize: 14 }}
          >+ 기록</button>
        }
      />
      <div className={styles.page}>
        <div className={styles.summary}>
          <div className={styles.stat}>
            <span className={styles.statNum}>{totalBooks}</span>
            <span className={styles.statLabel}>총 권수</span>
          </div>
          <div className={styles.divider} />
          <div className={styles.stat}>
            <span className={styles.statNum}>{totalMinutes}</span>
            <span className={styles.statLabel}>총 시간 (분)</span>
          </div>
        </div>

        {loading ? (
          <p style={{ textAlign: "center", color: "var(--text-tertiary)", padding: "var(--space-8) 0" }}>
            불러오는 중...
          </p>
        ) : logs.length === 0 ? (
          <EmptyState
            icon="📖"
            title="아직 독서 기록이 없어요"
            description="아이와 함께 읽은 책을 기록해보세요"
          />
        ) : (
          <div className={styles.list}>
            {logs.map((log) => (
              <div key={log.id} className={styles.card} onClick={() => openEdit(log)}>
                <div className={styles.cardLeft}>
                  <span className={styles.bookIcon}>📖</span>
                </div>
                <div className={styles.cardBody}>
                  <div className={styles.cardRow}>
                    <h3 className={styles.bookTitle}>{log.title}</h3>
                    <span className={styles.bookDate}>{log.read_date}</span>
                  </div>
                  {log.author && <p className={styles.bookAuthor}>{log.author}</p>}
                  <div className={styles.cardMeta}>
                    <span>⏱ {log.duration_minutes}분</span>
                    {log.rating && <span>{"⭐".repeat(log.rating)}</span>}
                  </div>
                  {log.memo && <p className={styles.bookMemo}>{log.memo}</p>}
                </div>
                <button
                  className={styles.deleteBtn}
                  onClick={(e) => { e.stopPropagation(); handleDelete(log.id); }}
                >✕</button>
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <Modal
          title={editingId ? "독서 기록 수정" : "독서 기록 추가"}
          onClose={() => { setShowModal(false); resetForm(); }}
        >
          <div className={styles.form}>
            <Input label="책 제목" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="어떤 책을 읽었나요?" />
            <Input label="저자 (선택)" value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="저자명" />

            <div className={styles.formRow}>
              <Input label="읽은 날짜" type="date" value={readDate} onChange={(e) => setReadDate(e.target.value)} />
              <Input label="읽은 시간 (분)" type="number" value={duration} onChange={(e) => setDuration(e.target.value)} />
            </div>

            <div className={styles.formSection}>
              <label className={styles.formLabel}>평점</label>
              <div className={styles.ratingRow}>
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    className={`${styles.starBtn} ${n <= rating ? styles.starActive : ""}`}
                    onClick={() => setRating(n === rating ? 0 : n)}
                  >
                    ⭐
                  </button>
                ))}
              </div>
            </div>

            <div className={styles.formSection}>
              <label className={styles.formLabel}>메모 (선택)</label>
              <textarea
                className={styles.textarea}
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
                placeholder="이 책에 대한 한줄평을 남겨보세요"
                rows={2}
              />
            </div>

            <Button onClick={handleSave} loading={saving} disabled={!title.trim()}>
              {editingId ? "수정하기" : "기록하기"}
            </Button>
          </div>
        </Modal>
      )}
    </>
  );
}
