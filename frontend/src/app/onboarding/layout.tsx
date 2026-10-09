import MembershipGate from "@/components/auth/MembershipGate";

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return <MembershipGate>{children}</MembershipGate>;
}
