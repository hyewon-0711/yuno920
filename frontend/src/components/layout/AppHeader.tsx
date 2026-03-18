"use client";

import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

interface AppHeaderProps {
  title: string;
  showBack?: boolean;
  rightAction?: React.ReactNode;
}

export default function AppHeader({ title, showBack = false, rightAction }: AppHeaderProps) {
  const router = useRouter();

  return (
    <header className="sticky top-0 z-40 flex h-14 items-center bg-white/80 px-5 backdrop-blur-md">
      <div className="flex w-10 items-center">
        {showBack && (
          <button onClick={() => router.back()} className="p-1">
            <ArrowLeft size={24} className="text-gray-700" />
          </button>
        )}
      </div>
      <h1 className="flex-1 text-center text-xl font-semibold text-gray-900">
        {title}
      </h1>
      <div className="flex w-10 items-center justify-end">
        {rightAction}
      </div>
    </header>
  );
}
