"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { Activity, Home, TrendingUp, PenSquare, Gamepad2, Sparkles, Settings } from "lucide-react";
import styles from "./BottomNav.module.css";

const tabs = [
  { href: "/dashboard", label: "홈", icon: Home, color: "var(--tab-home)" },
  { href: "/activities", label: "활동", icon: Activity, color: "var(--brand-primary)" },
  { href: "/growth", label: "성장", icon: TrendingUp, color: "var(--tab-growth)" },
  { href: "/records", label: "기록", icon: PenSquare, color: "var(--tab-record)" },
  { href: "/play", label: "놀이", icon: Gamepad2, color: "var(--tab-play)" },
  { href: "/insight", label: "인사이트", icon: Sparkles, color: "var(--tab-insight)" },
  { href: "/settings", label: "설정", icon: Settings, color: "var(--text-secondary)" },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className={styles.nav}>
      <div className={styles.inner}>
        {tabs.map((tab) => {
          const isActive = pathname.startsWith(tab.href);
          const Icon = tab.icon;
          const color = isActive ? tab.color : "#9CA3AF";
          return (
            <Link key={tab.href} href={tab.href} className={styles.tab}>
              <Icon size={24} strokeWidth={isActive ? 2.5 : 1.5} style={{ color }} />
              <span
                className={[styles.tabLabel, isActive ? styles.tabLabelActive : ""].join(" ")}
                style={{ color }}
              >
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
