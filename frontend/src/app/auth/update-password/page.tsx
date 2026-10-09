"use client";

import { useEffect, useRef, useState } from "react";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import Link from "next/link";
import AuthFrame from "@/components/auth/AuthFrame";
import styles from "../login/page.module.css";

export default function UpdatePasswordPage() {
  const recoveryClient = useRef<SupabaseClient | null>(null);
  const [status, setStatus] = useState<"checking" | "ready" | "invalid" | "done">("checking");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    // Initialize here so the subscription is attached before URL recovery finishes.
    // Recovery credentials stay in memory and do not replace an existing login.
    if (!recoveryClient.current) recoveryClient.current = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { auth: { persistSession: false, autoRefreshToken: false, storageKey: "yuno-password-recovery" } },
    );
    // Only a recovery event opens this form; an unrelated existing login does not.
    const { data: { subscription } } = recoveryClient.current.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" && session) setStatus("ready");
      if (event === "SIGNED_OUT") setStatus(current => current === "done" ? current : "invalid");
    });
    const timeout = window.setTimeout(() => setStatus(current => current === "checking" ? "invalid" : current), 8000);
    return () => { subscription.unsubscribe(); window.clearTimeout(timeout); };
  }, []);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (loading || status !== "ready" || !recoveryClient.current) return;
    if (password.length < 8 || !/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) {
      setError("비밀번호는 영문과 숫자를 포함해 8자 이상 입력해주세요.");
      return;
    }
    if (password !== confirmation) { setError("비밀번호가 일치하지 않습니다."); return; }
    setLoading(true);
    setError("");
    try {
      const { error } = await recoveryClient.current.auth.updateUser({ password });
      if (error) setError(error.code === "same_password" ? "기존 비밀번호와 다른 비밀번호를 입력해주세요." : "변경하지 못했습니다. 다른 비밀번호로 시도하거나 재설정 링크를 다시 요청해주세요.");
      else {
        setStatus("done");
        setPassword("");
        setConfirmation("");
        await recoveryClient.current.auth.signOut({ scope: "local" });
      }
    } catch { setError("서버에 연결하지 못했습니다. 잠시 후 다시 시도해주세요."); }
    finally { setLoading(false); }
  }

  return <AuthFrame>
    <div className={styles.formHeading}><span className={styles.overline}>A FRESH START</span><h2>새 비밀번호 설정</h2><p>영문과 숫자를 포함해 8자 이상으로 설정해주세요.</p></div>
    {status === "checking" && <p className={styles.interestHint} role="status">재설정 링크를 확인하고 있어요...</p>}
    {status === "invalid" && <p className={styles.error} role="alert">재설정 링크가 만료되었거나 유효하지 않습니다. 새 링크를 요청해주세요.</p>}
    {status === "done" && <p className={styles.success} role="status">비밀번호를 변경했어요. 새 비밀번호로 로그인해주세요.</p>}
    {status === "ready" && <form className={styles.form} onSubmit={handleSubmit} aria-busy={loading}>
      <div className={styles.inputGroup}><label htmlFor="password" className={styles.label}>새 비밀번호</label><input id="password" className={styles.input} type="password" autoComplete="new-password" minLength={8} value={password} onChange={e => setPassword(e.target.value)} disabled={loading} required /></div>
      <div className={styles.inputGroup}><label htmlFor="confirmation" className={styles.label}>새 비밀번호 확인</label><input id="confirmation" className={styles.input} type="password" autoComplete="new-password" minLength={8} value={confirmation} onChange={e => setConfirmation(e.target.value)} disabled={loading} required /></div>
      {error && <p className={styles.error} role="alert">{error}</p>}
      <button type="submit" className={styles.submitBtn} disabled={loading}>{loading ? "변경 중..." : "비밀번호 변경하기"}</button>
    </form>}
    <div className={styles.footer}><Link href={status === "invalid" ? "/auth/reset-password" : "/auth/login"} className={styles.link}>{status === "invalid" ? "새 재설정 링크 요청하기" : "로그인으로 돌아가기"}</Link></div>
  </AuthFrame>;
}
