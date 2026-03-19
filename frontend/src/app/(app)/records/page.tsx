"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useChild } from "@/hooks/useChild";
import AppHeader from "@/components/layout/AppHeader";
import { Tag, EmptyState } from "@/components/ui";
import styles from "./page.module.css";

interface RecordItem {
  id: string;
  content: string;
  mood: string | null;
  categories: string[];
  photos: string[];
  recorded_at: string;
  created_at: string;
}

const moodEmoji: { [key: string]: string } = {
  happy: "😊", neutral: "😐", sad: "😢", sick: "🤒", tired: "😴",
};

const categoryLabel: { [key: string]: string } = {
  health: "건강", meal: "식사", learning: "학습", play: "놀이",
  emotion: "감정", reading: "독서", milestone: "마일스톤",
};

export default function RecordsPage() {
  const router = useRouter();
  const { child } = useChild();
  const [records, setRecords] = useState<RecordItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"records" | "reading" | "milestones">("records");

  const fetchRecords = useCallback(async () => {
    if (!child) return;
    setLoading(true);
    const { data } = await supabase
      .from("records")
      .select("*")
      .eq("child_id", child.id)
      .order("recorded_at", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(50);
    if (data) setRecords(data as RecordItem[]);
    setLoading(false);
  }, [child]);

  useEffect(() => { fetchRecords(); }, [fetchRecords]);

  const handleDelete = async (id: string) => {
    if (!confirm("이 기록을 삭제할까요?")) return;
    await supabase.from("records").delete().eq("id", id);
    fetchRecords();
  };

  return (
    <>
      <AppHeader
        title="Record"
        rightAction={
          <button
            onClick={() => router.push("/records/new")}
            style={{ color: "var(--brand-primary)", fontWeight: 600, fontSize: 14 }}
          >
            + 새 기록
          </button>
        }
      />
      <div className={styles.page}>
        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${tab === "records" ? styles.tabActive : ""}`}
            onClick={() => setTab("records")}
          >📝 기록</button>
          <button
            className={`${styles.tab} ${tab === "reading" ? styles.tabActive : ""}`}
            onClick={() => { setTab("reading"); router.push("/records/reading"); }}
          >📖 독서</button>
          <button
            className={`${styles.tab} ${tab === "milestones" ? styles.tabActive : ""}`}
            onClick={() => { setTab("milestones"); router.push("/records/milestones"); }}
          >🏆 마일스톤</button>
        </div>

        {loading ? (
          <p style={{ textAlign: "center", color: "var(--text-tertiary)", padding: "var(--space-8) 0" }}>
            불러오는 중...
          </p>
        ) : records.length === 0 ? (
          <EmptyState
            icon="📝"
            title="아직 기록이 없어요"
            description="오늘 있었던 일을 기록해보세요"
          />
        ) : (
          <div className={styles.list}>
            {records.map((r) => (
              <div key={r.id} className={styles.card} onClick={() => router.push(`/records/${r.id}`)}>
                <div className={styles.cardHeader}>
                  <span className={styles.date}>{r.recorded_at}</span>
                  {r.mood && <span className={styles.mood}>{moodEmoji[r.mood] || ""}</span>}
                </div>
                <p className={styles.content}>{r.content}</p>
                {r.photos && r.photos.length > 0 && (
                  <div className={styles.photoCount}>📷 {r.photos.length}장</div>
                )}
                {r.categories && r.categories.length > 0 && (
                  <div className={styles.tags}>
                    {r.categories.map((c) => (
                      <Tag key={c} color={c as "health" | "meal" | "learning" | "play" | "emotion" | "reading" | "milestone"}>
                        {categoryLabel[c] || c}
                      </Tag>
                    ))}
                  </div>
                )}
                <button
                  className={styles.deleteBtn}
                  onClick={(e) => { e.stopPropagation(); handleDelete(r.id); }}
                >
                  삭제
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
