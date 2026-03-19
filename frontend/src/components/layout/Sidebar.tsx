"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  Home,
  TrendingUp,
  PenSquare,
  Gamepad2,
  Sparkles,
  Settings,
} from "lucide-react";
import styles from "./Sidebar.module.css";

const tabs = [
  { href: "/dashboard", label: "Home", icon: Home, color: "var(--tab-home)" },
  { href: "/growth", label: "Growth", icon: TrendingUp, color: "var(--tab-growth)" },
  { href: "/records", label: "Record", icon: PenSquare, color: "var(--tab-record)" },
  { href: "/play", label: "Play", icon: Gamepad2, color: "var(--tab-play)" },
  { href: "/insight", label: "Insight", icon: Sparkles, color: "var(--tab-insight)" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className={styles.sidebar}>
      <div className={styles.logo}>
        <span className={styles.logoIcon}>🌱</span>
        <span className={styles.logoText}>Yuno920</span>
      </div>

      <nav className={styles.nav}>
        {tabs.map((tab) => {
          const isActive = pathname.startsWith(tab.href);
          const Icon = tab.icon;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`${styles.navItem} ${isActive ? styles.navItemActive : ""}`}
              style={{ "--tab-color": tab.color } as React.CSSProperties}
            >
              <Icon size={20} strokeWidth={isActive ? 2.5 : 1.5} />
              <span>{tab.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className={styles.bottom}>
        <Link
          href="/settings"
          className={`${styles.navItem} ${pathname.startsWith("/settings") ? styles.navItemActive : ""}`}
        >
          <Settings size={20} strokeWidth={1.5} />
          <span>설정</span>
        </Link>
      </div>
    </aside>
  );
}
