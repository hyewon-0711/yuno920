"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { postWithAuth } from "@/lib/api";
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

  const [title, setTitle] = useState("");
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
      const { data: authData, error: authErr } = await supabase.auth.getUser();
      if (authErr) throw authErr;
      const userId = authData.user?.id;
      if (!userId) {
        throw new Error("로그인 정보가 없어요. 다시 로그인 후 시도해 주세요.");
      }

      let photoUrls: string[] = [];
      if (photos.length > 0) {
        photoUrls = await uploadPhotos(child.id);
      }

      const basePayload = {
        child_id: child.id,
        user_id: userId,
        content: content.trim(),
        mood: mood || null,
        categories: selectedCats,
        photos: photoUrls,
        recorded_at: today,
      };

      let data: { id: string } | null = null;
      let insertErr: { message?: string } | null = null;

      const insertWithTitle = await supabase
        .from("records")
        .insert({
          ...basePayload,
          title: title.trim() || null,
        })
        .select("id")
        .single();

      data = insertWithTitle.data as { id: string } | null;
      insertErr = insertWithTitle.error as { message?: string } | null;

      // 운영 DB 스키마 불일치 등으로 실패할 때 title 없이 fallback
      if (insertErr) {
        const fallbackInsert = await supabase
          .from("records")
          .insert(basePayload)
          .select("id")
          .single();
        data = fallbackInsert.data as { id: string } | null;
        insertErr = fallbackInsert.error as { message?: string } | null;
      }

      if (insertErr) throw insertErr;

      if (data?.id && content.trim().length > 10) {
        try {
          await postWithAuth("/api/ai/auto-tag", { record_id: data.id, content: content.trim() });
        } catch {
          // auto-tagging is non-critical
        }
      }

      router.push("/records");
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : (err as { message?: string; details?: string; hint?: string } | null)?.message ||
            (err as { details?: string } | null)?.details ||
            "저장에 실패했습니다";
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <AppHeader
        title="기록 등록"
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
          <label className={styles.label}>제목</label>
          <input
            className={styles.input}
            placeholder="나중에 기억할 내용 또는 오늘 있었던 일 기분등을 넣어주세요."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={200}
          />
          <span className={styles.charCount}>{title.length}/200자</span>
        </div>

        <div className={styles.section}>
          <label className={styles.label}>기록 내용</label>
          <textarea
            className={styles.textarea}
            placeholder="GPT 결과나 나중에 기억할 내용을 길게 붙여넣어도 됩니다."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={12}
          />
          <span className={styles.charCount}>{content.length}자</span>
        </div>

        <div className={styles.section}>
          <label className={styles.label}>사진 ({photos.length}/5)</label>
          <div className={styles.photoGrid}>
            {previews.map((src, idx) => (
              <div key={idx} className={styles.photoItem}>
                <Image src={src} alt="" width={160} height={120} unoptimized className={styles.photoThumb} />
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
