"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { canUseService, getMembership } from "@/lib/membership";
import styles from "./MembershipGate.module.css";

export default function MembershipGate({ children, operatorOnly = false }: { children: ReactNode; operatorOnly?: boolean }) {
  const router = useRouter();
  const pathname = usePathname();
  const [allowedPath, setAllowedPath] = useState<string | null>(null);
  const [error, setError] = useState("");
  const generation = useRef(0);
  const invalidate = useCallback(() => { generation.current++; }, []);

  const check = useCallback(async () => {
    const ticket = ++generation.current;
    setError("");
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
  return <main className={styles.screen} aria-busy={!error}>
    <div className={styles.glow} aria-hidden="true" />
    <section className={styles.card}>
      <div className={styles.brandLockup}>
        <span className={styles.brandMark} aria-hidden="true"><span /></span>
        <span className={styles.brandName}>Yuno<span>920</span></span>
      </div>

      {error ? <div className={styles.errorState}>
        <span className={styles.errorIcon} aria-hidden="true">!</span>
        <span className={styles.overline}>SORRY, ONE MORE STEP</span>
        <h1>잠시 확인이 필요해요</h1>
        <p role="alert">{error}</p>
        <button className={styles.retryButton} onClick={() => void check()}>다시 확인하기</button>
        <a className={styles.link} href="/auth/pending">내 가입 상태 확인</a>
      </div> : <div className={styles.loadingState}>
        <div className={styles.loader} role="progressbar" aria-label="가입 상태 확인 중">
          <span className={styles.loaderCore} aria-hidden="true"><span /></span>
        </div>
        <span className={styles.overline}>JUST A MOMENT</span>
        <h1>우리의 공간을 준비하고 있어요</h1>
        <p className={styles.description} role="status">가입 상태를 안전하게 확인하고 있어요.<br />곧 아이의 이야기가 이어집니다.</p>
        <div className={styles.progressTrack} aria-hidden="true"><span /></div>
        <p className={styles.waitNote}>잠시만 기다려주세요</p>
      </div>}
    </section>
  </main>;
}
