"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signUpWithEmail, signInWithOAuth } from "@/lib/auth";
import styles from "../login/page.module.css";

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const validate = (): string | null => {
    if (name.length < 2) return "이름은 2자 이상 입력해주세요.";
    if (password.length < 8) return "비밀번호는 8자 이상이어야 합니다.";
    if (!/[a-zA-Z]/.test(password) || !/[0-9]/.test(password))
      return "비밀번호는 영문과 숫자를 포함해야 합니다.";
    if (password !== passwordConfirm) return "비밀번호가 일치하지 않습니다.";
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError("");

    const { error: err } = await signUpWithEmail(email, password, name);
    if (err) {
      if (err.message.includes("already registered")) {
        setError("이미 등록된 이메일입니다. 로그인하거나 비밀번호를 재설정해주세요.");
      } else {
        setError(err.message);
      }
      setLoading(false);
    } else {
      router.push("/onboarding");
    }
  };

  const handleSocial = async (provider: "google" | "kakao") => {
    const { error: err } = await signInWithOAuth(provider);
    if (err) {
      setError("소셜 로그인에 실패했습니다. 다시 시도해주세요.");
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.logo}>
        <h1 className={styles.brand}>Yuno920</h1>
        <p className={styles.tagline}>가입하고 아이의 성장을 기록하세요</p>
      </div>

      <form className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.inputGroup}>
          <label className={styles.label}>이름</label>
          <input
            className={styles.input}
            type="text"
            placeholder="이름 입력"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            minLength={2}
            maxLength={20}
          />
        </div>

        <div className={styles.inputGroup}>
          <label className={styles.label}>이메일</label>
          <input
            className={styles.input}
            type="email"
            placeholder="example@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className={styles.inputGroup}>
          <label className={styles.label}>비밀번호</label>
          <input
            className={styles.input}
            type="password"
            placeholder="8자 이상, 영문+숫자"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
          />
        </div>

        <div className={styles.inputGroup}>
          <label className={styles.label}>비밀번호 확인</label>
          <input
            className={styles.input}
            type="password"
            placeholder="비밀번호 다시 입력"
            value={passwordConfirm}
            onChange={(e) => setPasswordConfirm(e.target.value)}
            required
          />
        </div>

        {error && <p className={styles.error}>{error}</p>}

        <button className={styles.submitBtn} type="submit" disabled={loading}>
          {loading ? "가입 중..." : "회원가입"}
        </button>
      </form>

      <div className={styles.divider}>
        <span className={styles.dividerLine} />
        <span className={styles.dividerText}>간편 가입</span>
        <span className={styles.dividerLine} />
      </div>

      <div className={styles.socialBtns}>
        <button
          type="button"
          className={`${styles.socialBtn} ${styles.googleBtn}`}
          onClick={() => handleSocial("google")}
        >
          <svg className={styles.socialIcon} viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Google로 가입
        </button>

        <button
          type="button"
          className={`${styles.socialBtn} ${styles.kakaoBtn}`}
          onClick={() => handleSocial("kakao")}
        >
          <svg className={styles.socialIcon} viewBox="0 0 24 24">
            <path fill="#191919" d="M12 3c-5.52 0-10 3.36-10 7.5 0 2.68 1.78 5.03 4.48 6.38-.2.73-.72 2.64-.82 3.05-.13.5.18.5.38.36.16-.1 2.5-1.7 3.52-2.39.79.12 1.6.18 2.44.18 5.52 0 10-3.36 10-7.5S17.52 3 12 3z"/>
          </svg>
          카카오로 가입
        </button>
      </div>

      <div className={styles.footer}>
        <a href="/auth/login" className={styles.link}>이미 계정이 있나요? 로그인</a>
      </div>
    </div>
  );
}
