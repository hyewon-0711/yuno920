"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export const ACTIVITY_AREAS = [
  { value: "learning", label: "학습" },
  { value: "physical", label: "신체" },
  { value: "creative", label: "예술/창의" },
  { value: "social", label: "사회성" },
  { value: "emotion", label: "정서" },
  { value: "reading", label: "독서" },
  { value: "habit", label: "생활습관" },
  { value: "other", label: "기타" },
] as const;

export const ACTIVITY_FREQUENCIES = [
  { value: "daily", label: "매일" },
  { value: "weekly_1", label: "주 1회" },
  { value: "weekly_2", label: "주 2회" },
  { value: "weekly_3", label: "주 3회" },
  { value: "weekly_4_plus", label: "주 4회 이상" },
  { value: "irregular", label: "비정기" },
] as const;

export type ActivityArea = (typeof ACTIVITY_AREAS)[number]["value"];
export type ActivityFrequency = (typeof ACTIVITY_FREQUENCIES)[number]["value"];

export interface ChildActivity {
  id: string;
  child_id: string;
  title: string;
  area: ActivityArea;
  frequency: ActivityFrequency;
  status: "active" | "paused" | "ended";
  created_at: string;
  updated_at: string;
}

export interface ActivityInput {
  title: string;
  area: ActivityArea;
  frequency: ActivityFrequency;
}

export interface ActivityAssessment {
  id: string;
  child_id: string;
  input_snapshot: Array<Pick<ChildActivity, "id" | "updated_at">> | unknown;
  result_json: {
    overall_score?: number;
    summary?: string;
    load_level?: string;
    balance?: Record<string, number>;
    keep?: Array<{ activity?: string; reason?: string }>;
    adjust?: Array<{ activity?: string; reason?: string }>;
    add?: Array<{ area?: string; suggestion?: string }>;
    parent_actions?: string[];
    disclaimer?: string;
  };
  summary: string;
  score: number;
  created_at: string;
}

export function getActivityAreaLabel(value: string) {
  return ACTIVITY_AREAS.find((item) => item.value === value)?.label || value;
}

export function getActivityFrequencyLabel(value: string) {
  return ACTIVITY_FREQUENCIES.find((item) => item.value === value)?.label || value;
}

export function useActivities(childId: string | undefined) {
  const [activities, setActivities] = useState<ChildActivity[]>([]);
  const [latestAssessment, setLatestAssessment] = useState<ActivityAssessment | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const fetchActivities = useCallback(async () => {
    if (!childId) {
      setActivities([]);
      setLatestAssessment(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setLoadError("");

    try {
      const [{ data: activityData, error: activityError }, { data: assessmentData, error: assessmentError }] =
        await Promise.all([
          supabase
            .from("child_activities")
            .select("*")
            .eq("child_id", childId)
            .eq("status", "active")
            .order("created_at", { ascending: false }),
          supabase
            .from("activity_assessments")
            .select("*")
            .eq("child_id", childId)
            .order("created_at", { ascending: false })
            .limit(1),
        ]);

      if (activityError) throw activityError;
      if (assessmentError) throw assessmentError;

      setActivities((activityData || []) as ChildActivity[]);
      setLatestAssessment((assessmentData?.[0] as ActivityAssessment | undefined) || null);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "활동 정보를 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }, [childId]);

  useEffect(() => {
    void fetchActivities();
  }, [fetchActivities]);

  const addActivity = async (input: ActivityInput) => {
    if (!childId) return;
    const { error } = await supabase.from("child_activities").insert({
      ...input,
      child_id: childId,
      status: "active",
    });
    if (error) throw error;
    await fetchActivities();
  };

  const updateActivity = async (id: string, input: ActivityInput) => {
    const { error } = await supabase.from("child_activities").update(input).eq("id", id);
    if (error) throw error;
    await fetchActivities();
  };

  const deleteActivity = async (id: string) => {
    const { error } = await supabase.from("child_activities").delete().eq("id", id);
    if (error) throw error;
    await fetchActivities();
  };

  const snapshot = Array.isArray(latestAssessment?.input_snapshot)
    ? latestAssessment.input_snapshot as Array<{ id?: string; updated_at?: string }>
    : [];
  const isAssessmentStale = Boolean(
    latestAssessment && (
      snapshot.length !== activities.length ||
      activities.some((activity) => {
        const saved = snapshot.find((item) => item.id === activity.id);
        return !saved || saved.updated_at !== activity.updated_at;
      })
    ),
  );

  return {
    activities,
    latestAssessment,
    isAssessmentStale,
    loading,
    loadError,
    addActivity,
    updateActivity,
    deleteActivity,
    refetch: fetchActivities,
  };
}
