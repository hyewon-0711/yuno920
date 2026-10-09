import MembershipGate from "@/components/auth/MembershipGate";
import { AuthProvider } from "@/contexts/AuthContext";
import AppShell from "@/components/layout/AppShell";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AuthProvider><MembershipGate operatorOnly><AppShell>{children}</AppShell></MembershipGate></AuthProvider>;
}
