"use client";

import { useCallback, useEffect, useState } from "react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { useAuth } from "@/contexts/AuthContext";
import { useChild } from "@/hooks/useChild";
import { supabase } from "@/lib/supabase";
import styles from "./page.module.css";

type NotificationSettings = { record_reminder: boolean; report_alert: boolean; reminder_time: string };
type FamilyMember = {
  id: string;
  user_id: string;
  role: "admin" | "editor" | "viewer";
  users: { name: string; email: string } | Array<{ name: string; email: string }> | null;
};

const defaultNotification: NotificationSettings = {
  record_reminder: true,
  report_alert: true,
  reminder_time: "20:00",
};

export default function SettingsDataSections() {
  const { user } = useAuth();
  const { child } = useChild();
  const [notification, setNotification] = useState(defaultNotification);
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"editor" | "viewer">("viewer");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!user || !child) return;
    setLoading(true);
    setError("");
    const [notificationResult, familyResult] = await Promise.all([
      supabase.from("notifications").select("record_reminder,report_alert,reminder_time").eq("user_id", user.id).eq("child_id", child.id).maybeSingle(),
      supabase.from("family_members").select("id,user_id,role,users(name,email)").eq("child_id", child.id).order("created_at"),
    ]);
    if (notificationResult.error) setError(notificationResult.error.message);
    else if (notificationResult.data) {
      setNotification({
        ...notificationResult.data,
        reminder_time: String(notificationResult.data.reminder_time).slice(0, 5),
      } as NotificationSettings);
    }
    if (familyResult.error) setError((current) => current || familyResult.error.message);
    else setMembers((familyResult.data || []) as unknown as FamilyMember[]);
    setLoading(false);
  }, [child, user]);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  const saveNotification = async () => {
    if (!user || !child) return;
    setSaving(true);
    setMessage("");
    setError("");
    const { error: saveError } = await supabase.from("notifications").upsert({
      user_id: user.id,
      child_id: child.id,
      ...notification,
    }, { onConflict: "user_id,child_id" });
    if (saveError) setError(saveError.message);
    else setMessage("알림 설정을 저장했습니다.");
    setSaving(false);
  };

  const addMember = async () => {
    if (!child || !email.trim()) return;
    setSaving(true);
    setMessage("");
    setError("");
    const { error: addError } = await supabase.rpc("add_family_member_by_email", {
      p_child_id: child.id,
      p_email: email.trim(),
      p_role: role,
    });
    if (addError) setError(addError.message);
    else {
      setEmail("");
      setMessage("가족 구성원을 추가했습니다.");
      await load();
    }
    setSaving(false);
  };

  const removeMember = async (member: FamilyMember) => {
    if (!child || member.user_id === child.user_id) return;
    setSaving(true);
    setMessage("");
    setError("");
    const { error: removeError } = await supabase.rpc("remove_family_member", {
      p_child_id: child.id,
      p_user_id: member.user_id,
    });
    if (removeError) setError(removeError.message);
    else {
      setMessage("가족 구성원을 삭제했습니다.");
      await load();
    }
    setSaving(false);
  };

  if (!child || loading) return <p className={styles.muted}>알림과 가족 정보를 불러오는 중...</p>;

  return (
    <>
      <section className={styles.card}>
        <h2 className={styles.cardTitle}>알림</h2>
        <p className={styles.cardDesc}>기록 알림과 AI 리포트 알림을 설정합니다.</p>
        <label className={styles.toggleRow}>
          <span>기록 리마인더</span>
          <input type="checkbox" checked={notification.record_reminder} onChange={(event) => setNotification((value) => ({ ...value, record_reminder: event.target.checked }))} />
        </label>
        <label className={styles.toggleRow}>
          <span>AI 리포트 알림</span>
          <input type="checkbox" checked={notification.report_alert} onChange={(event) => setNotification((value) => ({ ...value, report_alert: event.target.checked }))} />
        </label>
        <Input label="리마인더 시간" type="time" value={notification.reminder_time} onChange={(event) => setNotification((value) => ({ ...value, reminder_time: event.target.value }))} />
        <div className={styles.saveRow}><Button onClick={() => void saveNotification()} loading={saving}>알림 저장</Button></div>
      </section>

      <section className={styles.card}>
        <h2 className={styles.cardTitle}>가족 관리</h2>
        <p className={styles.cardDesc}>가입된 이메일로 가족을 추가하고 권한을 지정합니다.</p>
        <div className={styles.memberList}>
          {members.map((member) => {
            const profile = Array.isArray(member.users) ? member.users[0] : member.users;
            return (
              <div key={member.id} className={styles.memberRow}>
                <div><strong>{profile?.name || "가족"}</strong><span>{profile?.email || member.user_id}</span></div>
                <span>{member.role === "admin" ? "관리자" : member.role === "editor" ? "편집 가능" : "보기 전용"}</span>
                {member.user_id !== child.user_id && <button type="button" onClick={() => void removeMember(member)} disabled={saving}>삭제</button>}
              </div>
            );
          })}
        </div>
        <div className={styles.inviteRow}>
          <Input label="가족 이메일" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="family@example.com" />
          <label className={styles.selectLabel}>권한<select value={role} onChange={(event) => setRole(event.target.value as "editor" | "viewer")}><option value="viewer">보기 전용</option><option value="editor">편집 가능</option></select></label>
          <Button onClick={() => void addMember()} disabled={!email.trim()} loading={saving}>가족 추가</Button>
        </div>
      </section>
      {message && <p className={styles.ok}>{message}</p>}
      {error && <p className={styles.err} role="alert">{error}</p>}
    </>
  );
}
