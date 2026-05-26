import { Sidebar } from "@/components/layout/sidebar";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { ServiceWorkerRegister } from "@/components/pwa/ServiceWorkerRegister";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <ServiceWorkerRegister />
      <div className="min-h-screen bg-[#F8F9FA]">
        <Sidebar />
        <main className="ml-[240px] min-h-screen">
          <div className="max-w-[1400px] mx-auto p-8">{children}</div>
        </main>
      </div>
    </AuthGuard>
  );
}
