"use client";

import { useCallback, useEffect, useState } from "react";
import AppHeader from "@/components/layout/AppHeader";
import { supabase } from "@/lib/supabase";
import type { MembershipStatus } from "@/lib/membership";
import styles from "./page.module.css";

interface Member {
  user_id: string;
  email: string;
  name: string;
  status: MembershipStatus;
  version: number;
  requested_at: string;
  reviewed_at: string | null;
  email_verified: boolean;
}
const labels: Record<MembershipStatus, string> = { pending: "승인 대기", approved: "승인 완료", rejected: "거절", suspended: "이용 정지" };
const actions: Record<MembershipStatus, { status: MembershipStatus; label: string }[]> = {
  pending: [{ status: "approved", label: "승인" }, { status: "rejected", label: "거절" }],
  approved: [{ status: "suspended", label: "이용 정지" }],
  rejected: [{ status: "pending", label: "재심사" }],
  suspended: [{ status: "approved", label: "이용 재개" }],
};

export default function MembersPage() {
  const [status, setStatus] = useState<MembershipStatus>("pending");
  const [offset, setOffset] = useState(0);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [decision, setDecision] = useState<{ member: Member; status: MembershipStatus; label: string } | null>(null);
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const { data, error } = await supabase.rpc("list_memberships", { p_status: status, p_offset: offset });
      if (error) throw error;
      setMembers(data || []);
    } catch {
      setMembers([]);
      setError("가입 신청을 불러오지 못했습니다. 운영자 권한과 연결 상태를 확인해주세요.");
    } finally { setLoading(false); }
  }, [offset, status]);

  useEffect(() => {
    const start = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(start);
  }, [load]);

  async function review(event: React.FormEvent) {
    event.preventDefault();
    if (!decision || saving || !reason.trim()) return;
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const { error } = await supabase.rpc("review_membership", {
        p_user_id: decision.member.user_id,
        p_status: decision.status,
        p_expected_version: decision.member.version,
        p_reason: reason.trim(),
      });
      if (error) {
        if (error.code === "40001") {
          setDecision(null);
          await load();
          setError("다른 운영자가 먼저 변경했습니다. 새 목록을 확인해주세요.");
        } else setError(error.code === "P0001" ? error.message : "처리하지 못했습니다. 권한과 연결 상태를 확인하고 다시 시도해주세요.");
        return;
      }
      setNotice(`${decision.member.name || decision.member.email} 계정을 ${decision.label} 처리했습니다.`);
      setDecision(null);
      setReason("");
      await load();
    } catch { setError("서버에 연결하지 못했습니다. 목록을 새로고침해 처리 결과를 확인해주세요."); }
    finally { setSaving(false); }
  }

  return <>
    <AppHeader title="가입 승인 관리" />
    <div className={styles.page}>
      <div className={styles.intro}><span>MEMBERS</span><h1>함께할 가족을 맞이해요</h1><p>이메일 인증을 확인하고 가입 신청을 검토해주세요. 모든 처리 내역은 기록됩니다.</p></div>
      <div className={styles.toolbar}>
        <label>가입 상태 <select value={status} disabled={loading || saving || !!decision} onChange={e => { setStatus(e.target.value as MembershipStatus); setOffset(0); setNotice(""); }}>{Object.entries(labels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
        <button className={styles.secondary} disabled={loading || saving || !!decision} onClick={() => void load()}>새로고침</button>
      </div>
      {error && <p className={styles.error} role="alert">{error}</p>}
      {notice && <p className={styles.notice} role="status">{notice}</p>}
      {decision && <form className={styles.review} onSubmit={review}>
        <h2>{decision.member.name || "신청자"} · {decision.label}</h2><p>{decision.member.email}</p>
        <label htmlFor="reason">처리 사유 (운영자 기록용)</label>
        <textarea id="reason" value={reason} onChange={e => setReason(e.target.value)} maxLength={500} required disabled={saving} placeholder="처리 사유를 남겨주세요" />
        <div className={styles.actions}><button className={styles.primary} disabled={saving || !reason.trim()}>{saving ? "처리 중…" : `${decision.label} 확정`}</button><button type="button" className={styles.secondary} disabled={saving} onClick={() => setDecision(null)}>취소</button></div>
      </form>}
      {loading ? <p role="status">신청 목록을 확인하고 있어요…</p> : members.length === 0 ? <p className={styles.empty}>이 상태에 해당하는 신청이 없습니다.</p> : <ul className={styles.list}>{members.map(member => <li key={member.user_id} className={styles.member}>
        <div><h2>{member.name || "이름 없음"}</h2><p className={styles.email}>{member.email}</p><p className={styles.meta}>신청 {new Date(member.requested_at).toLocaleDateString("ko-KR")} · {member.email_verified ? "이메일 인증 완료" : "이메일 미인증"}</p></div>
        <div className={styles.actions}>{actions[member.status].map(action => <button key={action.status} className={action.status === "approved" ? styles.primary : styles.secondary} disabled={saving || !!decision || (action.status === "approved" && !member.email_verified)} onClick={() => { setDecision({ member, ...action }); setReason(""); setError(""); }}>{action.label}</button>)}</div>
      </li>)}</ul>}
      <div className={styles.pagination}><button className={styles.secondary} disabled={offset === 0 || loading || saving || !!decision} onClick={() => setOffset(Math.max(0, offset - 50))}>이전</button><span>{Math.floor(offset / 50) + 1} 페이지</span><button className={styles.secondary} disabled={members.length < 50 || loading || saving || !!decision} onClick={() => setOffset(offset + 50)}>다음</button></div>
    </div>
  </>;
}
