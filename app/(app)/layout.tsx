import { Sidebar } from "@/components/layout/Sidebar";
import { DemoBanner } from "@/components/layout/DemoBanner";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <DemoBanner />
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
