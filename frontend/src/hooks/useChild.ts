"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

export interface Child {
  id: string;
  user_id: string;
  name: string;
  birth_date: string;
  gender: "male" | "female";
  birth_time: string | null;
  avatar_url: string | null;
}

export function useChild() {
  const { user } = useAuth();
  const [child, setChild] = useState<Child | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    async function fetchChild() {
      // 온보딩(/onboarding)과 동일하게 limit(1)만 사용 — .single()은
      // 행 0개·2개 이상일 때 에러로 data=null이 되어 child가 영구 null이 될 수 있음
      // → 대시보드는 "아이 없음"으로 /onboarding, 온보딩은 "아이 있음"으로 /dashboard 왕복(깜빡임)
      const { data, error } = await supabase
        .from("children")
        .select("*")
        .eq("user_id", user!.id)
        .limit(1);

      if (!error && data?.length) setChild(data[0] as Child);
      setLoading(false);
    }

    fetchChild();
  }, [user]);

  return { child, loading };
}
