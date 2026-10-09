import { AuthProvider } from "@/contexts/AuthContext";
import AppShell from "@/components/layout/AppShell";
import MembershipGate from "@/components/auth/MembershipGate";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <MembershipGate><AppShell>{children}</AppShell></MembershipGate>
    </AuthProvider>
  );
}
