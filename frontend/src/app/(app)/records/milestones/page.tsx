"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { useChild } from "@/hooks/useChild";
import AppHeader from "@/components/layout/AppHeader";
import { Button, Input, EmptyState } from "@/components/ui";
import Modal from "@/components/ui/Modal";
import styles from "./page.module.css";

interface Milestone {
  id: string;
  title: string;
  achieved_date: string;
  category: string;
  description: string | null;
  photo_url: string | null;
}

const milestoneCategories = [
  { key: "physical", emoji: "🏃", label: "신체" },
  { key: "cognitive", emoji: "🧠", label: "인지" },
  { key: "language", emoji: "🗣️", label: "언어" },
  { key: "social", emoji: "👫", label: "사회성" },
  { key: "emotion", emoji: "💛", label: "감정" },
  { key: "daily", emoji: "🏠", label: "일상생활" },
];

export default function MilestonesPage() {
  const { child } = useChild();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("physical");
  const [achievedDate, setAchievedDate] = useState(new Date().toISOString().split("T")[0]);
  const [description, setDescription] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchMilestones = useCallback(async () => {
    if (!child) return;
    setLoading(true);
    const { data } = await supabase
      .from("milestones")
      .select("*")
      .eq("child_id", child.id)
      .order("achieved_date", { ascending: false });
    if (data) setMilestones(data as Milestone[]);
    setLoading(false);
  }, [child]);

  useEffect(() => { fetchMilestones(); }, [fetchMilestones]);

  const resetForm = () => {
    setTitle("");
    setCategory("physical");
    setAchievedDate(new Date().toISOString().split("T")[0]);
    setDescription("");
    setPhoto(null);
    setPhotoPreview("");
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhoto(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const handleSave = async () => {
    if (!child || !title.trim()) return;
    setSaving(true);

    let photoUrl: string | null = null;

    if (photo) {
      const ext = photo.name.split(".").pop();
      const path = `${child.id}/${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("milestone-photos").upload(path, photo);
      if (!error) {
        const { data } = supabase.storage.from("milestone-photos").getPublicUrl(path);
        photoUrl = data.publicUrl;
      }
    }

    await supabase.from("milestones").insert({
      child_id: child.id,
      title: title.trim(),
      category,
      achieved_date: achievedDate,
      description: description.trim() || null,
      photo_url: photoUrl,
    });

    resetForm();
    setShowModal(false);
    fetchMilestones();
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("이 마일스톤을 삭제할까요?")) return;
    await supabase.from("milestones").delete().eq("id", id);
    fetchMilestones();
  };

  const catInfo = (key: string) => milestoneCategories.find((c) => c.key === key) || { emoji: "🏆", label: key };

  return (
    <>
      <AppHeader
        title="마일스톤"
        backHref="/records"
        rightAction={
          <button
            onClick={() => setShowModal(true)}
            style={{ color: "var(--brand-primary)", fontWeight: 600, fontSize: 14 }}
          >+ 등록</button>
        }
      />
      <div className={styles.page}>
        {loading ? (
          <p style={{ textAlign: "center", color: "var(--text-tertiary)", padding: "var(--space-8) 0" }}>
            불러오는 중...
          </p>
        ) : milestones.length === 0 ? (
          <EmptyState
            icon="🏆"
            title="아직 마일스톤이 없어요"
            description="아이의 첫 걸음, 첫 말... 소중한 순간을 기록하세요"
          />
        ) : (
          <div className={styles.timeline}>
            {milestones.map((m) => {
              const ci = catInfo(m.category);
              return (
                <div key={m.id} className={styles.card}>
                  <div className={styles.cardIcon}>{ci.emoji}</div>
                  <div className={styles.cardBody}>
                    <div className={styles.cardHeader}>
                      <h3 className={styles.cardTitle}>{m.title}</h3>
                      <span className={styles.cardDate}>{m.achieved_date}</span>
                    </div>
                    <span className={styles.catBadge}>{ci.label}</span>
                    {m.description && <p className={styles.cardDesc}>{m.description}</p>}
                    {m.photo_url && <img src={m.photo_url} alt="" className={styles.cardPhoto} />}
                    <button className={styles.deleteBtn} onClick={() => handleDelete(m.id)}>삭제</button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showModal && (
        <Modal title="마일스톤 등록" onClose={() => { setShowModal(false); resetForm(); }}>
          <div className={styles.form}>
            <Input label="제목" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="예: 첫 걸음마" />

            <div className={styles.formSection}>
              <label className={styles.formLabel}>카테고리</label>
              <div className={styles.catGrid}>
                {milestoneCategories.map((c) => (
                  <button
                    key={c.key}
                    className={`${styles.catChip} ${category === c.key ? styles.catActive : ""}`}
                    onClick={() => setCategory(c.key)}
                  >
                    <span>{c.emoji}</span>
                    <span>{c.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <Input
              label="달성일"
              type="date"
              value={achievedDate}
              onChange={(e) => setAchievedDate(e.target.value)}
            />

            <div className={styles.formSection}>
              <label className={styles.formLabel}>설명 (선택)</label>
              <textarea
                className={styles.textarea}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="이 순간을 기록해주세요..."
                rows={3}
              />
            </div>

            <div className={styles.formSection}>
              <label className={styles.formLabel}>사진 (선택)</label>
              {photoPreview ? (
                <div className={styles.previewWrap}>
                  <img src={photoPreview} alt="" className={styles.preview} />
                  <button onClick={() => { setPhoto(null); setPhotoPreview(""); }} className={styles.removePhoto}>✕</button>
                </div>
              ) : (
                <button className={styles.uploadBtn} onClick={() => fileInputRef.current?.click()}>
                  📷 사진 선택
                </button>
              )}
              <input ref={fileInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handlePhotoChange} />
            </div>

            <Button onClick={handleSave} loading={saving} disabled={!title.trim()}>
              등록하기
            </Button>
          </div>
        </Modal>
      )}
    </>
  );
}
