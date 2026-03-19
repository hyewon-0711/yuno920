"use client";

import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import styles from "./AppHeader.module.css";

interface AppHeaderProps {
  title: string;
  showBack?: boolean;
  backHref?: string;
  rightAction?: React.ReactNode;
}

export default function AppHeader({ title, showBack, backHref, rightAction }: AppHeaderProps) {
  const router = useRouter();
  const shouldShowBack = showBack || !!backHref;

  const handleBack = () => {
    if (backHref) {
      router.push(backHref);
    } else {
      router.back();
    }
  };

  return (
    <header className={styles.header}>
      <div className={styles.left}>
        {shouldShowBack && (
          <button onClick={handleBack} className={styles.backBtn}>
            <ArrowLeft size={24} />
          </button>
        )}
      </div>
      <h1 className={styles.title}>{title}</h1>
      <div className={styles.right}>{rightAction}</div>
    </header>
  );
}
