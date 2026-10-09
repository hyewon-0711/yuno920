"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useChild } from "@/hooks/useChild";
import { useSchedules } from "@/hooks/useSchedules";
import { useReadingToday } from "@/hooks/useReadingToday";
import AppHeader from "@/components/layout/AppHeader";
import PageIntro from "@/components/layout/PageIntro";
import WeatherSection from "./components/WeatherSection";
import ScheduleSection from "./components/ScheduleSection";
import WeeklyTimetableSection from "./components/WeeklyTimetableSection";
import ReadingSection from "./components/ReadingSection";
import CoachingSection from "./components/CoachingSection";
import styles from "./page.module.css";

export default function DashboardPage() {
  const router = useRouter();
  const redirectingRef = useRef(false);
  const { user, loading: authLoading } = useAuth();
  const { child, loading: childLoading } = useChild();
  const { schedules, loading: schedLoading, addSchedule, deleteSchedule } = useSchedules(child?.id);
  const { reading, loading: readingLoading } = useReadingToday(child?.id);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      if (!redirectingRef.current) {
        redirectingRef.current = true;
        router.replace("/auth/login");
      }
      return;
    }
    if (childLoading) return;
    if (!child) {
      if (!redirectingRef.current) {
        redirectingRef.current = true;
        router.replace("/onboarding");
      }
    }
  }, [authLoading, user, childLoading, child, router]);

  if (authLoading || childLoading) {
    return (
      <>
        <AppHeader title="우리 아이의 하루" />
        <div className={styles.page}>
          <p style={{ textAlign: "center", color: "var(--text-tertiary)" }}>불러오는 중...</p>
        </div>
      </>
    );
  }

  if (!child) return null;

  return (
    <>
      <AppHeader title="우리 아이의 하루" />
      <div className={styles.page}>
        <PageIntro eyebrow="LITTLE MOMENTS, BIG GROWTH" title={`${child.name}의 오늘도, 함께`} description="함께한 시간과 작은 성장을 모아, 우리 아이만의 하루를 만들어가요." />

        <ScheduleSection
          schedules={schedules}
          loading={schedLoading}
          onAdd={addSchedule}
          onDelete={deleteSchedule}
        />

        <WeeklyTimetableSection childId={child.id} />

        <CoachingSection childId={child.id} childName={child.name} />

        <div className={styles.grid}>
          <WeatherSection />
          <ReadingSection
            totalMinutes={reading.totalMinutes}
            bookCount={reading.bookCount}
            recentBook={reading.recentBook}
            goalMinutes={reading.goalMinutes}
            loading={readingLoading}
          />
        </div>
      </div>
    </>
  );
}
