"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { getMembership } from "@/lib/membership";
import Link from "next/link";
import {
  Activity,
  Home,
  TrendingUp,
  PenSquare,
  Gamepad2,
  Sparkles,
  Settings,
  Sprout,
  ShieldCheck,
} from "lucide-react";
import styles from "./Sidebar.module.css";

const tabs = [
  { href: "/dashboard", label: "홈", icon: Home, color: "var(--tab-home)" },
  { href: "/activities", label: "활동", icon: Activity, color: "var(--brand-primary)" },
  { href: "/growth", label: "성장", icon: TrendingUp, color: "var(--tab-growth)" },
  { href: "/records", label: "기록", icon: PenSquare, color: "var(--tab-record)" },
  { href: "/play", label: "놀이", icon: Gamepad2, color: "var(--tab-play)" },
  { href: "/insight", label: "인사이트", icon: Sparkles, color: "var(--tab-insight)" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [operator, setOperator] = useState(false);
  useEffect(() => {
    let cancelled = false;
    getMembership().then(m => { if (!cancelled) setOperator(m.is_operator); }).catch(() => { if (!cancelled) setOperator(false); });
    return () => { cancelled = true; };
  }, []);

  return (
    <aside className={styles.sidebar}>
      <Link href="/dashboard" className={styles.logo} aria-label="Yuno920 홈">
        <span className={styles.logoIcon}><Sprout size={22} /></span>
        <span className={styles.logoText}>yuno<span>920</span></span>
      </Link>
      <p className={styles.navLabel}>우리 아이의 하루</p>

      <nav className={styles.nav}>
        {tabs.map((tab) => {
          const isActive = pathname.startsWith(tab.href);
          const Icon = tab.icon;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              aria-current={isActive ? "page" : undefined}
              className={`${styles.navItem} ${isActive ? styles.navItemActive : ""}`}
            >
              <Icon size={20} strokeWidth={isActive ? 2.5 : 1.5} />
              <span>{tab.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className={styles.bottom}>
        {operator && <Link href="/admin/members" className={`${styles.navItem} ${pathname.startsWith("/admin") ? styles.navItemActive : ""}`}><ShieldCheck size={20} /><span>가입 승인 관리</span></Link>}
        <Link
          href="/settings"
          className={`${styles.navItem} ${pathname.startsWith("/settings") ? styles.navItemActive : ""}`}
        >
          <Settings size={20} strokeWidth={1.5} />
          <span>설정</span>
        </Link>
        <p className={styles.note}>작은 오늘이 모여,<br />아이의 내일이 돼요.</p>
      </div>
    </aside>
  );
}
