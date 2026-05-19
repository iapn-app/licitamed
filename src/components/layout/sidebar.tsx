"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  Users,
  ClipboardList,
  FolderOpen,
  Settings,
  Activity,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/licitacoes", label: "Licitações", icon: FileText },
  { href: "/fornecedores", label: "Fornecedores", icon: Users },
  { href: "/cotacoes", label: "Cotações", icon: ClipboardList },
  { href: "/documentos", label: "Documentos", icon: FolderOpen },
  { href: "/configuracoes", label: "Configurações", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 h-screen w-[240px] bg-white border-r border-neutral-200 flex flex-col z-30">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 py-4 border-b border-neutral-100">
        <div className="w-7 h-7 rounded-md bg-[#1A56DB] flex items-center justify-center flex-shrink-0">
          <Activity className="w-4 h-4 text-white" strokeWidth={2.5} />
        </div>
        <div>
          <span className="text-sm font-semibold text-neutral-900 tracking-tight">LicitaMed</span>
          <span className="block text-[10px] text-neutral-400 leading-none mt-0.5">Gestão de Cotações</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto scrollbar-thin">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive =
            href === "/"
              ? pathname === "/"
              : pathname.startsWith(href);

          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-100",
                isActive
                  ? "bg-[#EBF0FD] text-[#1A56DB]"
                  : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900"
              )}
            >
              <Icon
                className={cn(
                  "w-4 h-4 flex-shrink-0",
                  isActive ? "text-[#1A56DB]" : "text-neutral-400"
                )}
              />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-5 py-4 border-t border-neutral-100">
        <p className="text-xs font-medium text-neutral-700 truncate">DistribMed Hospitalar</p>
        <p className="text-[10px] text-neutral-400 mt-0.5">v1.0.0 — Beta</p>
      </div>
    </aside>
  );
}
