"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Eye, EyeOff, LoaderCircle } from "lucide-react";
import AuthFrame from "@/components/auth/AuthFrame";
import { signInWithEmail } from "@/lib/auth";
import styles from "./page.module.css";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [visible, setVisible] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setError("");
    try {
      const { error: err } = await signInWithEmail(email.trim(), password);
      if (err) {
        setError(err.code === "email_not_confirmed" ? "가입한 이메일의 인증을 완료한 뒤 로그인해주세요." : err.status === 429 ? "요청이 많습니다. 잠시 후 다시 시도해주세요." : "이메일 또는 비밀번호를 확인해주세요.");
        setLoading(false);
      } else router.push("/auth/pending");
    } catch {
      setError("서버에 연결하지 못했습니다. 네트워크 연결을 확인하고 다시 시도해주세요.");
      setLoading(false);
    }
  };
  return <AuthFrame>
    <div className={styles.formHeading}><span className={styles.overline}>WELCOME BACK</span><h2>다시 만나 반가워요</h2><p>오늘은 어떤 소중한 순간이 기다리고 있을까요?</p></div>
    <form className={styles.form} onSubmit={handleSubmit} aria-busy={loading}>
      <div className={styles.inputGroup}><label className={styles.label} htmlFor="email">이메일</label><input id="email" name="email" className={styles.input} type="email" autoComplete="email" placeholder="example@email.com" value={email} onChange={e => setEmail(e.target.value)} required disabled={loading} /></div>
      <div className={styles.inputGroup}><div className={styles.labelRow}><label className={styles.label} htmlFor="password">비밀번호</label><Link href="/auth/reset-password" className={styles.forgotLink}>비밀번호를 잊으셨나요?</Link></div><div className={styles.passwordField}><input id="password" name="password" className={styles.input} type={visible ? "text" : "password"} autoComplete="current-password" placeholder="비밀번호를 입력해주세요" value={password} onChange={e => setPassword(e.target.value)} required disabled={loading} /><button type="button" className={styles.eyeButton} aria-label={visible ? "비밀번호 숨기기" : "비밀번호 보기"} aria-pressed={visible} onClick={() => setVisible(!visible)}>{visible ? <EyeOff size={19} /> : <Eye size={19} />}</button></div></div>
      {error && <p className={styles.error} role="alert">{error}</p>}
      <button className={styles.submitBtn} type="submit" disabled={loading}>{loading ? <><LoaderCircle size={18} className={styles.spinner} />로그인 중...</> : <>로그인<ArrowRight size={18} /></>}</button>
    </form>
    <div className={styles.footer}><span>아직 Yuno920이 처음이신가요?</span><Link href="/auth/signup" className={styles.link}>이메일로 시작하기 <ArrowRight size={14} /></Link></div>
    <p className={styles.formNote}>우리 아이의 이야기를 이어가요.</p>
  </AuthFrame>;
}
