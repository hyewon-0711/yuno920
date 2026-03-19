"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import AppHeader from "@/components/layout/AppHeader";
import { Button } from "@/components/ui";
import EmotionSelector, { type Mood } from "@/components/ui/EmotionSelector";
import styles from "./page.module.css";

const categoryLabel: Record<string, string> = {
  health: "💊 건강", meal: "🍽️ 식사", learning: "📚 학습", play: "🎮 놀이",
  emotion: "💛 감정", reading: "📖 독서", milestone: "🏆 마일스톤",
};

const moodEmoji: Record<string, string> = {
  happy: "😊", neutral: "😐", sad: "😢", sick: "🤒", tired: "😴",
};

interface RecordData {
  id: string;
  content: string;
  mood: string | null;
  categories: string[];
  photos: string[];
  recorded_at: string;
  created_at: string;
}

export default function RecordDetailPage() {
  const router = useRouter();
  const params = useParams();
  const recordId = params.id as string;

  const [record, setRecord] = useState<RecordData | null>(null);
  const [editing, setEditing] = useState(false);
  const [content, setContent] = useState("");
  const [mood, setMood] = useState<Mood | undefined>(undefined);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchRecord = useCallback(async () => {
    const { data } = await supabase
      .from("records")
      .select("*")
      .eq("id", recordId)
      .single();
    if (data) {
      setRecord(data as RecordData);
      setContent(data.content);
      setMood(data.mood as Mood | undefined);
    }
    setLoading(false);
  }, [recordId]);

  useEffect(() => { fetchRecord(); }, [fetchRecord]);

  const handleSave = async () => {
    setSaving(true);
    const { error } = await supabase.from("records").update({
      content: content.trim(),
      mood: mood || null,
    }).eq("id", recordId);

    if (!error) {
      setEditing(false);
      fetchRecord();
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!confirm("정말 삭제할까요? 이 작업은 되돌릴 수 없습니다.")) return;
    await supabase.from("records").delete().eq("id", recordId);
    router.push("/records");
  };

  if (loading) {
    return (
      <>
        <AppHeader title="기록" backHref="/records" />
        <div style={{ padding: "var(--space-8)", textAlign: "center", color: "var(--text-tertiary)" }}>
          불러오는 중...
        </div>
      </>
    );
  }

  if (!record) {
    return (
      <>
        <AppHeader title="기록" backHref="/records" />
        <div style={{ padding: "var(--space-8)", textAlign: "center", color: "var(--text-tertiary)" }}>
          기록을 찾을 수 없습니다
        </div>
      </>
    );
  }

  return (
    <>
      <AppHeader
        title={editing ? "기록 수정" : "기록 상세"}
        backHref="/records"
        rightAction={
          editing ? (
            <Button size="small" onClick={handleSave} loading={saving}>저장</Button>
          ) : (
            <button
              onClick={() => setEditing(true)}
              style={{ color: "var(--tab-record)", fontWeight: 600, fontSize: 14 }}
            >수정</button>
          )
        }
      />

      <div className={styles.page}>
        <div className={styles.meta}>
          <span className={styles.date}>{record.recorded_at}</span>
          {record.mood && !editing && (
            <span className={styles.moodLabel}>{moodEmoji[record.mood]} {record.mood}</span>
          )}
        </div>

        {editing && (
          <div className={styles.section}>
            <label className={styles.label}>기분</label>
            <EmotionSelector value={mood} onChange={(m) => setMood(m)} />
          </div>
        )}

        {editing ? (
          <textarea
            className={styles.textarea}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={8}
          />
        ) : (
          <p className={styles.content}>{record.content}</p>
        )}

        {record.categories && record.categories.length > 0 && (
          <div className={styles.tags}>
            {record.categories.map((c) => (
              <span key={c} className={styles.tag}>{categoryLabel[c] || c}</span>
            ))}
          </div>
        )}

        {record.photos && record.photos.length > 0 && (
          <div className={styles.photoGrid}>
            {record.photos.map((url, i) => (
              <img key={i} src={url} alt="" className={styles.photo} />
            ))}
          </div>
        )}

        {!editing && (
          <div className={styles.actions}>
            <Button variant="ghost" onClick={handleDelete} style={{ color: "var(--status-error)" }}>
              기록 삭제
            </Button>
          </div>
        )}

        {editing && (
          <Button variant="ghost" onClick={() => { setEditing(false); setContent(record.content); setMood(record.mood as Mood | undefined); }}>
            취소
          </Button>
        )}
      </div>
    </>
  );
}
