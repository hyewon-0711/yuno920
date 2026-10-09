"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AuthFrame from "@/components/auth/AuthFrame";
import { supabase } from "@/lib/supabase";
import { canUseService, getApprovedDestination, getMembership, type Membership } from "@/lib/membership";
import styles from "../login/page.module.css";

export default function PendingPage() {
  const router = useRouter();
  const [membership, setMembership] = useState<Membership | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const check = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error || !user) { router.replace("/auth/login"); return; }
      const current = await getMembership();
      setMembership(current);
      if (canUseService(current)) router.replace(await getApprovedDestination());
    } catch (err) { setError(err instanceof Error ? err.message : "가입 상태를 확인하지 못했습니다."); }
    finally { setLoading(false); }
  }, [router]);

  useEffect(() => {
    const start = window.setTimeout(() => void check(), 0);
    return () => window.clearTimeout(start);
  }, [check]);

  const title = !membership ? "가입 상태 확인" : !membership.email_verified ? "이메일을 확인해주세요" : membership.status === "rejected" ? "가입 심사 결과 안내" : membership.status === "suspended" ? "서비스 이용이 제한되었어요" : membership.status === "approved" ? "승인이 완료되었어요" : "운영자 승인을 기다리고 있어요";
  const message = !membership ? "잠시만 기다려주세요." : !membership.email_verified ? "가입한 이메일로 받은 인증 링크를 확인해주세요. 이메일 인증 후 운영자가 가입 신청을 검토합니다." : membership.status === "rejected" ? "이번 가입 신청은 승인되지 않았습니다. 재심사가 필요하면 가입을 안내한 운영자에게 문의해주세요." : membership.status === "suspended" ? "현재 계정은 이용 정지 상태입니다. 가입을 안내한 운영자에게 문의해주세요." : membership.status === "approved" ? "아이의 이야기를 시작할 준비가 되었어요." : "가입 신청이 접수되었습니다. 승인 후 아이 등록과 성장 기록을 이용할 수 있어요.";

  async function logout() {
    const { error } = await supabase.auth.signOut();
    if (error) setError("로그아웃하지 못했습니다. 다시 시도해주세요.");
    else router.replace("/auth/login");
  }

  return <AuthFrame>
    <div className={styles.formHeading}><span className={styles.overline}>GROW TOGETHER</span><h2>{title}</h2><p>{message}</p></div>
    {membership?.requested_at && <p className={styles.interestHint}>신청일: {new Date(membership.requested_at).toLocaleDateString("ko-KR")}</p>}
    {error && <p className={styles.error} role="alert">{error}</p>}
    <button className={styles.submitBtn} disabled={loading} onClick={() => void check()}>{loading ? "확인 중…" : "승인 상태 새로고침"}</button>
    <div className={styles.footer}>
      {membership?.is_operator && <Link href="/admin/members" className={styles.link}>가입 승인 관리</Link>}
      <Link href="/auth/reset-password" className={styles.link}>비밀번호 재설정</Link>
      <button className={styles.link} onClick={() => void logout()}>로그아웃</button>
    </div>
  </AuthFrame>;
}
