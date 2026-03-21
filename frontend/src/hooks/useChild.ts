"use client";

import { useState, useEffect, useRef } from "react";
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
  const hasFetchedForUser = useRef(false);

  useEffect(() => {
    if (!user) {
      hasFetchedForUser.current = false;
      setChild(null);
      setLoading(false);
      return;
    }

    hasFetchedForUser.current = false;
    setLoading(true);

    let cancelled = false;

    async function fetchChild() {
      const { data, error } = await supabase
        .from("children")
        .select("*")
        .eq("user_id", user!.id)
        .limit(1);

      if (cancelled) return;
      hasFetchedForUser.current = true;
      if (!error && data?.length) setChild(data[0] as Child);
      else setChild(null);
      setLoading(false);
    }

    fetchChild();
    return () => {
      cancelled = true;
    };
  }, [user]);

  // user가 있는데 child가 null이고 아직 fetch 완료 전이면 loading으로 간주 (리다이렉트 루프 방지)
  const effectiveLoading =
    loading || (!!user && child === null && !hasFetchedForUser.current);

  return { child, loading: effectiveLoading };
}
