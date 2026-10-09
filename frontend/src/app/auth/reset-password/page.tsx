"use client";

import { useState } from "react";
import Link from "next/link";
import AuthFrame from "@/components/auth/AuthFrame";
import { supabase } from "@/lib/supabase";
import styles from "../login/page.module.css";

export default function ResetPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (loading) return;
    setLoading(true);
    setError("");
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/auth/update-password`,
      });
      if (error) setError(error.status === 429 ? "요청이 많습니다. 잠시 후 다시 시도해주세요." : "메일을 보내지 못했습니다. 잠시 후 다시 시도해주세요.");
      else setSent(true);
    } catch {
      setError("서버에 연결하지 못했습니다. 네트워크 연결을 확인해주세요.");
    } finally { setLoading(false); }
  }

  return <AuthFrame>
    <div className={styles.formHeading}><span className={styles.overline}>A FRESH START</span><h2>비밀번호를 잊으셨나요?</h2><p>가입한 이메일로 비밀번호 재설정 링크를 보내드릴게요.</p></div>
    {sent ? <p className={styles.success} role="status">등록된 이메일이라면 재설정 안내가 발송됩니다. 메일함과 스팸함을 확인해주세요.</p> : <form className={styles.form} onSubmit={handleSubmit} aria-busy={loading}>
      <div className={styles.inputGroup}><label className={styles.label} htmlFor="email">이메일</label><input id="email" name="email" className={styles.input} type="email" autoComplete="email" placeholder="example@email.com" value={email} onChange={e => setEmail(e.target.value)} disabled={loading} required /></div>
      {error && <p className={styles.error} role="alert">{error}</p>}
      <button type="submit" className={styles.submitBtn} disabled={loading}>{loading ? "메일 보내는 중..." : "재설정 링크 보내기"}</button>
    </form>}
    <div className={styles.footer}><Link href="/auth/login" className={styles.link}>로그인으로 돌아가기</Link></div>
  </AuthFrame>;
}
