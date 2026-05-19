import { Sidebar } from "@/components/layout/sidebar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      <Sidebar />
      <main className="ml-[240px] min-h-screen">
        <div className="max-w-[1400px] mx-auto p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
