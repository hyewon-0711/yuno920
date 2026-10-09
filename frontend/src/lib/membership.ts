import { supabase } from "./supabase";

export type MembershipStatus = "pending" | "approved" | "rejected" | "suspended";
export interface Membership {
  status: MembershipStatus;
  email_verified: boolean;
  is_operator: boolean;
  requested_at: string;
}

export async function getMembership(): Promise<Membership> {
  const { data, error } = await supabase.rpc("get_my_membership");
  if (error || !data || !["pending", "approved", "rejected", "suspended"].includes(data.status)) {
    throw new Error("가입 승인 상태를 확인하지 못했습니다. 잠시 후 다시 시도해주세요.");
  }
  return data as Membership;
}

export function canUseService(membership: Membership) {
  return membership.status === "approved" && membership.email_verified === true;
}

export async function getApprovedDestination() {
  const { data, error } = await supabase.from("children").select("id").limit(1);
  if (error) throw new Error("아이 정보를 확인하지 못했습니다. 다시 시도해주세요.");
  return data?.length ? "/dashboard" : "/onboarding";
}
