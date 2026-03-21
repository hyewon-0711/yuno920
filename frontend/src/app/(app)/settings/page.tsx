"use client";

import { useRouter } from "next/navigation";
import AppHeader from "@/components/layout/AppHeader";
import Button from "@/components/ui/Button";
import { useAuth } from "@/contexts/AuthContext";
import styles from "./page.module.css";

export default function SettingsPage() {
  const router = useRouter();
  const { signOut } = useAuth();

  const handleLogout = async () => {
    await signOut();
    router.push("/auth/login");
  };

  return (
    <>
      <AppHeader title="설정" showBack />
      <div className={styles.page}>
        <div className={styles.placeholder}>프로필 · 알림 · 가족 관리 설정이 표시됩니다</div>
        <Button variant="ghost" fullWidth onClick={handleLogout}>
          로그아웃
        </Button>
      </div>
    </>
  );
}
