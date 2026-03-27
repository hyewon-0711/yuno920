"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import InterestChipRow from "@/components/parent/InterestChipRow";
import AppHeader from "@/components/layout/AppHeader";
import Button from "@/components/ui/Button";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { getSupabaseErrorMessage, hintForMissingInterestColumn } from "@/lib/supabaseErrors";
import { normalizeInterestIds, type ParentInterestId } from "@/lib/parentInterests";
import styles from "./page.module.css";

export default function SettingsPage() {
  const router = useRouter();
  const { signOut } = useAuth();
  const [interests, setInterests] = useState<ParentInterestId[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);
  const [saveErr, setSaveErr] = useState<string | null>(null);
  const [loadErr, setLoadErr] = useState<string | null>(null);

  useEffect(() => {
    let cancel = false;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        if (!cancel) setLoading(false);
        return;
      }
      const { data, error } = await supabase
        .from("users")
        .select("parent_interest_tags")
        .eq("id", user.id)
        .maybeSingle();
      if (cancel) return;
      if (error) {
        console.error("settings load interests:", error.message, error);
        const msg = getSupabaseErrorMessage(error);
        const hint = hintForMissingInterestColumn(msg);
        setLoadErr(hint ? `${msg}\n\n${hint}` : msg);
      } else {
        const raw = (data?.parent_interest_tags as string[] | null) ?? [];
        setInterests(normalizeInterestIds(raw));
        setLoadErr(null);
      }
      setLoading(false);
    })();
    return () => {
      cancel = true;
    };
  }, []);

  const handleSaveInterests = async () => {
    setSaving(true);
    setSaveMsg(null);
    setSaveErr(null);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/auth/login");
        return;
      }
      const { data, error } = await supabase
        .from("users")
        .update({ parent_interest_tags: interests })
        .eq("id", user.id)
        .select("id, parent_interest_tags")
        .maybeSingle();

      if (error) {
        const msg = getSupabaseErrorMessage(error);
        const hint = hintForMissingInterestColumn(msg);
        setSaveErr(hint ? `${msg}\n\n${hint}` : msg);
        return;
      }
      if (!data) {
        setSaveErr(
          "계정 프로필(users)을 찾을 수 없습니다. 로그아웃 후 다시 로그인해 보세요. 문제가 계속되면 Supabase의 auth.users와 public.users 트리거(handle_new_user)를 확인해 주세요.",
        );
        return;
      }
      setSaveMsg("저장했습니다.");
    } catch (e) {
      const msg = getSupabaseErrorMessage(e);
      const hint = hintForMissingInterestColumn(msg);
      setSaveErr(hint ? `${msg}\n\n${hint}` : msg);
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await signOut();
    router.push("/auth/login");
  };

  return (
    <>
      <AppHeader title="설정" showBack />
      <div className={styles.page}>
        <section className={styles.card}>
          <h2 className={styles.cardTitle}>부모 관심사</h2>
          <p className={styles.cardDesc}>Insight의 데일리 트렌드 뉴스에 반영됩니다. (최대 6개)</p>
          {loadErr && (
            <p className={styles.err} role="alert">
              {loadErr}
            </p>
          )}
          {loading ? (
            <p className={styles.muted}>불러오는 중...</p>
          ) : (
            <>
              <InterestChipRow selected={interests} onChange={setInterests} disabled={saving || !!loadErr} />
              <div className={styles.saveRow}>
                <Button
                  variant="primary"
                  onClick={() => void handleSaveInterests()}
                  disabled={saving || !!loadErr}
                >
                  {saving ? "저장 중..." : "관심사 저장"}
                </Button>
                {saveMsg && <span className={styles.ok}>{saveMsg}</span>}
                {saveErr && <span className={styles.err}>{saveErr}</span>}
              </div>
            </>
          )}
        </section>

        <div className={styles.placeholder}>알림 · 가족 관리 등은 추후 연결됩니다</div>
        <Button variant="ghost" fullWidth onClick={handleLogout}>
          로그아웃
        </Button>
      </div>
    </>
  );
}
