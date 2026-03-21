"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import styles from "./page.module.css";

type Gender = "male" | "female";

export default function OnboardingPage() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [checking, setChecking] = useState(true);
  const [name, setName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [gender, setGender] = useState<Gender | null>(null);
  const [birthTime, setBirthTime] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [globalError, setGlobalError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function checkChild() {
      const { data: { user } } = await supabase.auth.getUser();
      if (cancelled) return;
      if (!user) {
        router.replace("/auth/login");
        return;
      }
      const { data, error } = await supabase
        .from("children")
        .select("id")
        .eq("user_id", user.id)
        .limit(1);
      if (cancelled) return;
      if (error) {
        console.error("onboarding children check:", error);
        setChecking(false);
        return;
      }
      if (data && data.length > 0) {
        router.replace("/dashboard");
        return;
      }
      setChecking(false);
    }

    checkChild();
    return () => {
      cancelled = true;
    };
    // router는 Next에서 안정적이나, 의존성 변경 시 중복 요청으로 깜빡임 방지용 cleanup
  }, [router]);

  if (checking) {
    return (
      <div className={styles.container}>
        <p style={{ textAlign: "center", color: "var(--text-tertiary)", padding: "var(--space-8) 0" }}>
          확인 중...
        </p>
      </div>
    );
  }

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setErrors((prev) => ({ ...prev, avatar: "사진 크기를 5MB 이하로 줄여주세요" }));
      return;
    }

    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
    setErrors((prev) => {
      const next = { ...prev };
      delete next.avatar;
      return next;
    });
  };

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!name.trim() || name.trim().length < 2) errs.name = "이름은 2자 이상 입력해주세요";
    if (name.trim().length > 20) errs.name = "이름은 20자 이내로 입력해주세요";
    if (!birthDate) errs.birthDate = "생년월일을 선택해주세요";
    if (birthDate && new Date(birthDate) > new Date()) errs.birthDate = "올바른 생년월일을 선택해주세요";
    if (!gender) errs.gender = "성별을 선택해주세요";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setGlobalError("");

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/auth/login");
        return;
      }

      let avatarUrl: string | null = null;

      if (avatarFile) {
        const ext = avatarFile.name.split(".").pop();
        const path = `${user.id}/${Date.now()}.${ext}`;
        const { error: uploadErr } = await supabase.storage
          .from("avatars")
          .upload(path, avatarFile);

        if (uploadErr) {
          console.error("Avatar upload failed:", uploadErr);
        } else {
          const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
          avatarUrl = urlData.publicUrl;
        }
      }

      const { error: insertErr } = await supabase.from("children").insert({
        user_id: user.id,
        name: name.trim(),
        birth_date: birthDate,
        gender,
        birth_time: birthTime || null,
        avatar_url: avatarUrl,
      });

      if (insertErr) throw insertErr;

      router.push("/dashboard");
    } catch (err) {
      console.error(err);
      setGlobalError("프로필 저장에 실패했습니다. 다시 시도해주세요.");
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>아이 프로필 등록</h1>
        <p className={styles.subtitle}>아이의 기본 정보를 입력해주세요</p>
      </div>

      <div className={styles.avatarSection}>
        <div className={styles.avatarWrapper}>
          <div className={styles.avatar}>
            {avatarPreview ? (
              <img src={avatarPreview} alt="avatar" />
            ) : (
              "👶"
            )}
          </div>
          <button
            type="button"
            className={styles.avatarBtn}
            onClick={() => fileRef.current?.click()}
          >
            📷
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png"
            className={styles.hiddenInput}
            onChange={handleAvatarChange}
          />
        </div>
      </div>
      {errors.avatar && <p className={styles.errorText} style={{ textAlign: "center" }}>{errors.avatar}</p>}

      <form className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.inputGroup}>
          <label className={styles.label}>이름</label>
          <input
            className={`${styles.input} ${errors.name ? styles.inputError : ""}`}
            type="text"
            placeholder="아이 이름"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          {errors.name && <span className={styles.errorText}>{errors.name}</span>}
        </div>

        <div className={styles.inputGroup}>
          <label className={styles.label}>생년월일</label>
          <input
            className={`${styles.input} ${errors.birthDate ? styles.inputError : ""}`}
            type="date"
            value={birthDate}
            onChange={(e) => setBirthDate(e.target.value)}
          />
          {errors.birthDate && <span className={styles.errorText}>{errors.birthDate}</span>}
        </div>

        <div className={styles.inputGroup}>
          <label className={styles.label}>성별</label>
          <div className={styles.genderRow}>
            <button
              type="button"
              className={`${styles.genderOption} ${gender === "male" ? styles.genderSelected : ""}`}
              onClick={() => setGender("male")}
            >
              👦 남자
            </button>
            <button
              type="button"
              className={`${styles.genderOption} ${gender === "female" ? styles.genderSelected : ""}`}
              onClick={() => setGender("female")}
            >
              👧 여자
            </button>
          </div>
          {errors.gender && <span className={styles.errorText}>{errors.gender}</span>}
        </div>

        <div className={styles.inputGroup}>
          <label className={styles.label}>
            출생 시간 <span className={styles.optionalLabel}>(선택 · 기질 분석에 활용)</span>
          </label>
          <input
            className={styles.input}
            type="time"
            value={birthTime}
            onChange={(e) => setBirthTime(e.target.value)}
          />
        </div>

        {globalError && <p className={styles.globalError}>{globalError}</p>}

        <div className={styles.footer}>
          <button className={styles.submitBtn} type="submit" disabled={loading}>
            {loading ? "저장 중..." : "시작하기 🎉"}
          </button>
        </div>
      </form>
    </div>
  );
}
