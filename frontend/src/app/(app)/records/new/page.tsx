"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useChild } from "@/hooks/useChild";
import AppHeader from "@/components/layout/AppHeader";
import { Button } from "@/components/ui";
import EmotionSelector, { type Mood } from "@/components/ui/EmotionSelector";
import styles from "./page.module.css";

const categories = [
  { key: "health", emoji: "💊", label: "건강" },
  { key: "meal", emoji: "🍽️", label: "식사" },
  { key: "learning", emoji: "📚", label: "학습" },
  { key: "play", emoji: "🎮", label: "놀이" },
  { key: "emotion", emoji: "💛", label: "감정" },
  { key: "reading", emoji: "📖", label: "독서" },
  { key: "milestone", emoji: "🏆", label: "마일스톤" },
];

export default function NewRecordPage() {
  const router = useRouter();
  const { child } = useChild();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [content, setContent] = useState("");
  const [mood, setMood] = useState<Mood | undefined>(undefined);
  const [selectedCats, setSelectedCats] = useState<string[]>([]);
  const [photos, setPhotos] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const today = new Date().toISOString().split("T")[0];

  const toggleCategory = (key: string) => {
    setSelectedCats((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const handlePhotos = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (photos.length + files.length > 5) {
      setError("사진은 최대 5장까지 가능합니다");
      return;
    }
    setPhotos((prev) => [...prev, ...files]);
    const newPreviews = files.map((f) => URL.createObjectURL(f));
    setPreviews((prev) => [...prev, ...newPreviews]);
    setError("");
  };

  const removePhoto = (idx: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== idx));
    setPreviews((prev) => {
      URL.revokeObjectURL(prev[idx]);
      return prev.filter((_, i) => i !== idx);
    });
  };

  const uploadPhotos = async (childId: string): Promise<string[]> => {
    const urls: string[] = [];
    for (const file of photos) {
      const ext = file.name.split(".").pop();
      const path = `${childId}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabase.storage.from("record-photos").upload(path, file);
      if (!error) {
        const { data } = supabase.storage.from("record-photos").getPublicUrl(path);
        urls.push(data.publicUrl);
      }
    }
    return urls;
  };

  const handleSave = async () => {
    if (!child) return;
    if (!content.trim()) {
      setError("기록 내용을 입력해주세요");
      return;
    }

    setSaving(true);
    setError("");

    try {
      let photoUrls: string[] = [];
      if (photos.length > 0) {
        photoUrls = await uploadPhotos(child.id);
      }

      const { data, error: insertErr } = await supabase.from("records").insert({
        child_id: child.id,
        content: content.trim(),
        mood: mood || null,
        categories: selectedCats,
        photos: photoUrls,
        recorded_at: today,
      }).select("id").single();

      if (insertErr) throw insertErr;

      if (data?.id && content.trim().length > 10) {
        try {
          await fetch(
            `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/ai/auto-tag?record_id=${data.id}&content=${encodeURIComponent(content.trim())}`,
            { method: "POST" }
          );
        } catch {
          // auto-tagging is non-critical
        }
      }

      router.push("/records");
    } catch (err) {
      setError(err instanceof Error ? err.message : "저장에 실패했습니다");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <AppHeader
        title="새 기록"
        backHref="/records"
        rightAction={
          <Button size="small" onClick={handleSave} loading={saving}>
            저장
          </Button>
        }
      />
      <div className={styles.page}>
        <div className={styles.section}>
          <label className={styles.label}>날짜</label>
          <div className={styles.dateDisplay}>{today}</div>
        </div>

        <div className={styles.section}>
          <label className={styles.label}>오늘의 기분</label>
          <EmotionSelector value={mood} onChange={(m) => setMood(m)} />
        </div>

        <div className={styles.section}>
          <label className={styles.label}>카테고리</label>
          <div className={styles.catGrid}>
            {categories.map((cat) => (
              <button
                key={cat.key}
                className={`${styles.catChip} ${selectedCats.includes(cat.key) ? styles.catActive : ""}`}
                onClick={() => toggleCategory(cat.key)}
              >
                <span>{cat.emoji}</span>
                <span>{cat.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className={styles.section}>
          <label className={styles.label}>기록 내용</label>
          <textarea
            className={styles.textarea}
            placeholder="오늘 아이와의 일상을 기록해보세요..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={6}
          />
          <span className={styles.charCount}>{content.length}자</span>
        </div>

        <div className={styles.section}>
          <label className={styles.label}>사진 ({photos.length}/5)</label>
          <div className={styles.photoGrid}>
            {previews.map((src, idx) => (
              <div key={idx} className={styles.photoItem}>
                <img src={src} alt="" className={styles.photoThumb} />
                <button className={styles.photoRemove} onClick={() => removePhoto(idx)}>✕</button>
              </div>
            ))}
            {photos.length < 5 && (
              <button className={styles.photoAdd} onClick={() => fileInputRef.current?.click()}>
                📷<span>추가</span>
              </button>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            style={{ display: "none" }}
            onChange={handlePhotos}
          />
        </div>

        {error && <p className={styles.error}>{error}</p>}
      </div>
    </>
  );
}
