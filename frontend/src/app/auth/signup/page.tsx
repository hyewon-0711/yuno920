"use client";

import { useState } from "react";
import AuthFrame from "@/components/auth/AuthFrame";
import { useRouter } from "next/navigation";
import InterestChipRow from "@/components/parent/InterestChipRow";
import { signUpWithEmail } from "@/lib/auth";
import { PENDING_PARENT_INTERESTS_KEY, type ParentInterestId } from "@/lib/parentInterests";
import styles from "../login/page.module.css";

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [parentInterests, setParentInterests] = useState<ParentInterestId[]>([]);

  const validate = (): string | null => {
    if (name.trim().length < 2) return "이름은 2자 이상 입력해주세요.";
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

    if (loading) return;
    setLoading(true);
    setError("");

    try {
      const { data, error: err } = await signUpWithEmail(email.trim(), password, name.trim());
      if (err) {
        if (err.message.includes("already registered")) {
          setError("이미 등록된 이메일입니다. 로그인하거나 비밀번호를 재설정해주세요.");
        } else {
          setError("가입하지 못했습니다. 입력 내용을 확인하고 잠시 후 다시 시도해주세요.");
        }
      } else {
        try {
          sessionStorage.setItem(PENDING_PARENT_INTERESTS_KEY, JSON.stringify(parentInterests));
        } catch {
          /* ignore */
        }
        if (data.session) router.push("/auth/pending");
        else setSent(true);
      }
    } catch {
      setError("서버에 연결하지 못했습니다. 잠시 후 다시 시도해주세요.");
    } finally { setLoading(false); }
  };

  return (
    <AuthFrame>
      <div className={styles.formHeading}><span className={styles.overline}>GROW TOGETHER</span><h2>우리의 이야기를 시작해요</h2><p>아이의 소중한 순간을 차곡차곡 담아보세요.</p></div>

      {sent ? <p className={styles.success} role="status">입력한 이메일의 가입 안내를 확인해주세요. 가입 후 운영자가 승인해야 가입이 처리됩니다. 이미 가입한 계정이라면 로그인해주세요.</p> : <form className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.inputGroup}>
          <label className={styles.label} htmlFor="name">이름</label>
          <input id="name" name="name" autoComplete="name" disabled={loading}
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
          <label className={styles.label} htmlFor="email">이메일</label>
          <input id="email" name="email" autoComplete="email" disabled={loading}
            className={styles.input}
            type="email"
            placeholder="example@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className={styles.inputGroup}>
          <label className={styles.label} htmlFor="password">비밀번호</label>
          <input id="password" name="password" autoComplete="new-password" disabled={loading}
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
          <label className={styles.label} htmlFor="password-confirm">비밀번호 확인</label>
          <input id="password-confirm" name="password-confirm" autoComplete="new-password" disabled={loading}
            className={styles.input}
            type="password"
            placeholder="비밀번호 다시 입력"
            value={passwordConfirm}
            onChange={(e) => setPasswordConfirm(e.target.value)}
            required
          />
        </div>

        <div className={styles.inputGroup}>
          <label className={styles.label}>부모 관심사 (선택 · 최대 6개)</label>
          <p className={styles.interestHint}>Insight 맞춤 뉴스에 반영돼요. 나중에 설정에서 바꿀 수 있어요.</p>
          <InterestChipRow selected={parentInterests} onChange={setParentInterests} disabled={loading} />
        </div>

        {error && <p className={styles.error} role="alert">{error}</p>}

        <p className={styles.interestHint}>가입 후 운영자가 승인해야 가입이 처리됩니다.</p>
        <button className={styles.submitBtn} type="submit" disabled={loading}>
          {loading ? "가입 중..." : "회원가입"}
        </button>
      </form>}

      <div className={styles.footer}>
        <a href="/auth/login" className={styles.link}>이미 계정이 있나요? 로그인</a>
      </div>
    </AuthFrame>
  );
}
