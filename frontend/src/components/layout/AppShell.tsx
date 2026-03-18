import BottomNav from "./BottomNav";

interface AppShellProps {
  children: React.ReactNode;
}

export default function AppShell({ children }: AppShellProps) {
  return (
    <div className="mx-auto min-h-screen max-w-[480px] bg-background">
      <main className="pb-20">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
