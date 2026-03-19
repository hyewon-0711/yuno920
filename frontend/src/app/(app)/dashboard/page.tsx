"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useChild } from "@/hooks/useChild";
import { useSchedules } from "@/hooks/useSchedules";
import { useReadingToday } from "@/hooks/useReadingToday";
import AppHeader from "@/components/layout/AppHeader";
import WeatherSection from "./components/WeatherSection";
import ScheduleSection from "./components/ScheduleSection";
import ReadingSection from "./components/ReadingSection";
import CoachingSection from "./components/CoachingSection";
import styles from "./page.module.css";

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { child, loading: childLoading } = useChild();
  const { schedules, loading: schedLoading, addSchedule, deleteSchedule } = useSchedules(child?.id);
  const { reading, loading: readingLoading } = useReadingToday(child?.id);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth/login");
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    if (!authLoading && user && !childLoading && !child) {
      router.push("/onboarding");
    }
  }, [authLoading, user, childLoading, child, router]);

  if (authLoading || childLoading) {
    return (
      <>
        <AppHeader title="Home" />
        <div className={styles.page}>
          <p style={{ textAlign: "center", color: "var(--text-tertiary)" }}>불러오는 중...</p>
        </div>
      </>
    );
  }

  if (!child) return null;

  return (
    <>
      <AppHeader title="Home" />
      <div className={styles.page}>
        <section className={styles.greeting}>
          <h2 className="text-h1">
            {child.name}의 하루 💪
          </h2>
          <p className="text-body-sm" style={{ color: "var(--text-tertiary)" }}>
            오늘 하루를 기록하고 확인하세요
          </p>
        </section>

        <ScheduleSection
          schedules={schedules}
          loading={schedLoading}
          onAdd={addSchedule}
          onDelete={deleteSchedule}
        />

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
