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
      const { data, error } = await supabase
        .from("children")
        .select("*")
        .eq("user_id", user!.id)
        .limit(1)
        .single();

      if (!error && data) setChild(data as Child);
      setLoading(false);
    }

    fetchChild();
  }, [user]);

  return { child, loading };
}
