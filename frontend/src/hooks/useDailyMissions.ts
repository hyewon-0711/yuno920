"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export type MissionArea = "learning" | "physical" | "creative" | "social" | "habit";
export type MissionStatus = "assigned" | "in_progress" | "completed" | "skipped";

export interface MissionTemplate {
  id: string;
  title: string;
  description: string;
  area: MissionArea;
  estimated_minutes: number;
  difficulty: "easy" | "medium";
  is_bonus: boolean;
}

export interface DailyMission {
  id: string;
  child_id: string;
  mission_date: string;
  slot: number;
  template_id: string | null;
  title_snapshot: string;
  description_snapshot: string;
  area: MissionArea;
  estimated_minutes: number;
  is_bonus: boolean;
  status: MissionStatus;
  points: number;
  completed_at: string | null;
  completed_by: string | null;
  completion_note: string | null;
}

const slotPlan: Array<{ area: MissionArea; is_bonus: boolean }> = [
  { area: "physical", is_bonus: false },
  { area: "learning", is_bonus: false },
  { area: "social", is_bonus: false },
  { area: "creative", is_bonus: true },
  { area: "habit", is_bonus: true },
];

export function getMissionDate() {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

function stableNumber(value: string) {
  let result = 0;
  for (let index = 0; index < value.length; index += 1) {
    result = (result * 31 + value.charCodeAt(index)) >>> 0;
  }
  return result;
}

function pickMissions(childId: string, missionDate: string, templates: MissionTemplate[]) {
  const used = new Set<string>();
  return slotPlan.map((slot, index) => {
    const candidates = templates.filter((template) => template.area === slot.area && !used.has(template.id));
    if (candidates.length === 0) return null;
    const selected = candidates[stableNumber(`${childId}:${missionDate}:${index}`) % candidates.length];
    used.add(selected.id);
    return {
      mission_date: missionDate,
      slot: index,
      template_id: selected.id,
      title_snapshot: selected.title,
      description_snapshot: selected.description,
      area: selected.area,
      estimated_minutes: selected.estimated_minutes,
      is_bonus: selected.is_bonus,
      status: "assigned" as const,
      points: selected.is_bonus ? 5 : 10,
    };
  }).filter((mission): mission is NonNullable<typeof mission> => Boolean(mission));
}

export function useDailyMissions(childId: string | undefined) {
  const [missions, setMissions] = useState<DailyMission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchMissions = useCallback(async () => {
    if (!childId) {
      setMissions([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");
    const missionDate = getMissionDate();
    try {
      const { data: templates, error: templateError } = await supabase
        .from("mission_templates")
        .select("id,title,description,area,estimated_minutes,difficulty,is_bonus")
        .eq("active", true)
        .order("id");
      if (templateError) throw templateError;

      const generated = pickMissions(childId, missionDate, (templates || []) as MissionTemplate[]);
      if (generated.length < slotPlan.length) throw new Error("오늘의 미션을 준비할 수 없습니다");

      const { error: upsertError } = await supabase
        .from("daily_missions")
        .upsert(generated.map((mission) => ({ child_id: childId, ...mission })), {
          onConflict: "child_id,mission_date,slot",
          ignoreDuplicates: true,
        });
      if (upsertError) throw upsertError;

      const { data, error: missionError } = await supabase
        .from("daily_missions")
        .select("*")
        .eq("child_id", childId)
        .eq("mission_date", missionDate)
        .order("slot");
      if (missionError) throw missionError;
      setMissions((data || []) as DailyMission[]);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "오늘의 미션을 불러오지 못했습니다");
      setMissions([]);
    } finally {
      setLoading(false);
    }
  }, [childId]);

  useEffect(() => {
    void fetchMissions();
  }, [fetchMissions]);

  const toggleComplete = async (mission: DailyMission) => {
    const completed = mission.status === "completed";
    const next = {
      status: completed ? "assigned" : "completed",
      completed_at: completed ? null : new Date().toISOString(),
    };
    const { data, error: updateError } = await supabase
      .from("daily_missions")
      .update(next)
      .eq("id", mission.id)
      .select("*")
      .single();
    if (updateError) throw updateError;
    setMissions((current) => current.map((item) => item.id === mission.id ? data as DailyMission : item));
  };

  return {
    missions,
    loading,
    error,
    toggleComplete,
    refetch: fetchMissions,
  };
}
