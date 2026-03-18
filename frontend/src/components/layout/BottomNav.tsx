"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { Home, TrendingUp, PenSquare, Gamepad2, Sparkles } from "lucide-react";

const tabs = [
  { href: "/dashboard", label: "Home", icon: Home, color: "var(--color-tab-home)" },
  { href: "/growth", label: "Growth", icon: TrendingUp, color: "var(--color-tab-growth)" },
  { href: "/records", label: "Record", icon: PenSquare, color: "var(--color-tab-record)" },
  { href: "/play", label: "Play", icon: Gamepad2, color: "var(--color-tab-play)" },
  { href: "/insight", label: "Insight", icon: Sparkles, color: "var(--color-tab-insight)" },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white shadow-[0_-4px_12px_rgba(0,0,0,0.05)]">
      <div className="mx-auto flex h-16 max-w-[480px] items-center justify-around">
        {tabs.map((tab) => {
          const isActive = pathname.startsWith(tab.href);
          const Icon = tab.icon;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className="flex flex-col items-center gap-0.5 px-3 py-2"
            >
              <Icon
                size={24}
                strokeWidth={isActive ? 2.5 : 1.5}
                style={{ color: isActive ? tab.color : "#9CA3AF" }}
              />
              <span
                className="text-[10px] font-medium"
                style={{ color: isActive ? tab.color : "#9CA3AF" }}
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
