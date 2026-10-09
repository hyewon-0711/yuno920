"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import AppHeader from "@/components/layout/AppHeader";
import PageIntro from "@/components/layout/PageIntro";
import MissionBoard from "@/components/missions/MissionBoard";
import { useAuth } from "@/contexts/AuthContext";
import { useChild } from "@/hooks/useChild";
import styles from "./page.module.css";

export default function MissionsPage() {
  const router = useRouter();
  const redirecting = useRef(false);
  const { user, loading: authLoading } = useAuth();
  const { child, loading: childLoading } = useChild();

  useEffect(() => {
    if (authLoading || childLoading || redirecting.current) return;
    if (!user) {
      redirecting.current = true;
      router.replace("/auth/login");
    } else if (!child) {
      redirecting.current = true;
      router.replace("/onboarding");
    }
  }, [authLoading, child, childLoading, router, user]);

  if (authLoading || childLoading || !child) {
    return <><AppHeader title="오늘의 미션" showBack /><main className={styles.page}><p className={styles.loading}>오늘의 미션을 준비하고 있어요...</p></main></>;
  }

  return (
    <>
      <AppHeader title="오늘의 미션" showBack />
      <main className={styles.page}>
        <PageIntro eyebrow="SMALL STEPS, BIG MOMENTS" title={`${child.name}와 함께하는 오늘`} description="완벽하게 해내기보다, 함께 시도한 순간을 모아보세요." />
        <MissionBoard childId={child.id} />
      </main>
    </>
  );
}
