"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { canUseService, getMembership } from "@/lib/membership";
import styles from "@/app/auth/login/page.module.css";

export default function MembershipGate({ children, operatorOnly = false }: { children: ReactNode; operatorOnly?: boolean }) {
  const router = useRouter();
  const pathname = usePathname();
  const [allowedPath, setAllowedPath] = useState<string | null>(null);
  const [error, setError] = useState("");
  const generation = useRef(0);
  const invalidate = useCallback(() => { generation.current++; }, []);

  const check = useCallback(async () => {
    const ticket = ++generation.current;
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (ticket !== generation.current) return;
      if (authError || !user) {
        setAllowedPath(null);
        router.replace("/auth/login");
        return;
      }
      const membership = await getMembership();
      if (ticket !== generation.current) return;
      if (!canUseService(membership)) {
        setAllowedPath(null);
        router.replace("/auth/pending");
      } else if (operatorOnly && !membership.is_operator) {
        setAllowedPath(null);
        setError("운영자만 이용할 수 있는 페이지입니다.");
      } else {
        setError("");
        setAllowedPath(pathname);
      }
    } catch {
      if (ticket !== generation.current) return;
      setAllowedPath(null);
      setError("이용 권한을 확인하지 못했습니다. 잠시 후 다시 시도해주세요.");
    }
  }, [operatorOnly, pathname, router]);

  useEffect(() => {
    const initial = window.setTimeout(() => void check(), 0);
    const interval = window.setInterval(() => void check(), 30000);
    const onFocus = () => void check();
    window.addEventListener("focus", onFocus);
    const { data: { subscription } } = supabase.auth.onAuthStateChange(event => {
      if (event === "SIGNED_OUT") {
        invalidate();
        setAllowedPath(null);
        router.replace("/auth/login");
      }
    });
    return () => {
      invalidate();
      window.clearTimeout(initial);
      window.clearInterval(interval);
      window.removeEventListener("focus", onFocus);
      subscription.unsubscribe();
    };
  }, [check, invalidate, router]);

  if (allowedPath === pathname && !error) return children;
  return <main className={styles.gate}>
    <p role={error ? "alert" : "status"}>{error || "이용 권한을 확인하고 있어요…"}</p>
    {error && <button className={styles.submitBtn} onClick={() => void check()}>다시 확인하기</button>}
    <a className={styles.link} href="/auth/pending">내 가입 상태 확인</a>
  </main>;
}
