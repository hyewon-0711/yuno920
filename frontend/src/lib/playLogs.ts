import { supabase } from "@/lib/supabase";

export type NewPlayGameType =
  | "adventure"
  | "science"
  | "monster_math"
  | "shape_puzzle"
  | "word_explorer"
  | "pixel_studio";

export async function logPlaySession(input: {
  childId: string;
  gameType: NewPlayGameType;
  score: number;
  level?: number;
  correctCount?: number;
  totalCount?: number;
  startedAt: number;
}) {
  const { error } = await supabase.from("play_logs").insert({
    child_id: input.childId,
    game_type: input.gameType,
    score: Math.max(0, Math.round(input.score)),
    level: input.level ?? 1,
    correct_count: input.correctCount ?? 0,
    total_count: input.totalCount ?? 0,
    duration_seconds: Math.max(1, Math.round((Date.now() - input.startedAt) / 1000)),
  });

  if (error) throw error;
}
