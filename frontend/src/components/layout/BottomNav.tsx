"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { Home, TrendingUp, PenSquare, Gamepad2, Sparkles, Settings } from "lucide-react";
import styles from "./BottomNav.module.css";

const tabs = [
  { href: "/dashboard", label: "Home", icon: Home, color: "var(--tab-home)" },
  { href: "/growth", label: "Growth", icon: TrendingUp, color: "var(--tab-growth)" },
  { href: "/records", label: "Record", icon: PenSquare, color: "var(--tab-record)" },
  { href: "/play", label: "Play", icon: Gamepad2, color: "var(--tab-play)" },
  { href: "/insight", label: "Insight", icon: Sparkles, color: "var(--tab-insight)" },
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
