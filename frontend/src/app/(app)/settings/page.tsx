"use client";

import AppHeader from "@/components/layout/AppHeader";
import styles from "./page.module.css";

export default function SettingsPage() {
  return (
    <>
      <AppHeader title="설정" showBack />
      <div className={styles.page}>
        <div className={styles.placeholder}>프로필 · 알림 · 가족 관리 설정이 표시됩니다</div>
      </div>
    </>
  );
}
