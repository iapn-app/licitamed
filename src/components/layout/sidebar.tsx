"use client";

import type { ComponentType } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  Users,
  ClipboardList,
  FolderOpen,
  Settings,
  Activity,
  Radar,
  Radio,
  TrendingUp,
  Sparkles,
  ClipboardCheck,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";

type NavChild = {
  href: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
};

type NavItem = {
  href: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
  children?: NavChild[];
};

const navItems: NavItem[] = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/licitacoes", label: "Licitações", icon: FileText },
  {
    href: "/fornecedores",
    label: "Fornecedores",
    icon: Users,
    children: [
      { href: "/fornecedores/radar", label: "Radar", icon: Radar },
    ],
  },
  { href: "/cotacoes", label: "Cotações", icon: ClipboardList },
  { href: "/analise-oportunidade", label: "Análise", icon: TrendingUp },
  { href: "/preco-vencedor", label: "Preço IA", icon: Sparkles },
  { href: "/execucao", label: "Execução", icon: ClipboardCheck },
  { href: "/monitor", label: "Monitor", icon: Radio },
  { href: "/documentos", label: "Documentos", icon: FolderOpen },
  { href: "/configuracoes", label: "Configurações", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  function handleLogout() {
    if (typeof window !== "undefined") {
      localStorage.removeItem("licitamed_user");
    }
    router.push("/login");
  }

  return (
    <aside className="fixed left-0 top-0 h-screen w-[240px] bg-white border-r border-neutral-200 flex flex-col z-30">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 py-4 border-b border-neutral-100">
        <div className="w-7 h-7 rounded-md bg-[#06B6D4] flex items-center justify-center flex-shrink-0">
          <Activity className="w-4 h-4 text-white" strokeWidth={2.5} />
        </div>
        <div>
          <span className="text-sm font-semibold text-neutral-900 tracking-tight">POWER MED</span>
          <span className="block text-[10px] text-neutral-400 leading-none mt-0.5">Gestão de Licitações</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto scrollbar-thin">
        {navItems.map(({ href, label, icon: Icon, children }) => {
          const isActive =
            href === "/"
              ? pathname === "/"
              : pathname === href || pathname.startsWith(href + "/");

          return (
            <div key={href}>
              <Link
                href={href}
                style={isActive
                  ? { boxShadow: "0 4px 15px rgba(6, 182, 212, 0.5), 0 2px 6px rgba(6, 182, 212, 0.3)", transition: "box-shadow 0.3s ease" }
                  : { transition: "box-shadow 0.3s ease" }}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-100",
                  isActive
                    ? "bg-[#ECFEFF] text-[#06B6D4]"
                    : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900"
                )}
              >
                <Icon
                  className={cn(
                    "w-4 h-4 flex-shrink-0",
                    isActive ? "text-[#06B6D4]" : "text-neutral-400"
                  )}
                />
                {label}
              </Link>

              {children && isActive && (
                <div className="ml-7 pl-3 border-l border-neutral-200 mt-0.5 mb-0.5 space-y-0.5">
                  {children.map(({ href: ch, label: cl, icon: ChildIcon }) => {
                    const childActive =
                      pathname === ch || pathname.startsWith(ch + "/");
                    return (
                      <Link
                        key={ch}
                        href={ch}
                        className={cn(
                          "flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-colors duration-100",
                          childActive
                            ? "bg-[#ECFEFF] text-[#06B6D4]"
                            : "text-neutral-500 hover:bg-neutral-100 hover:text-neutral-700"
                        )}
                      >
                        <ChildIcon
                          className={cn(
                            "w-3.5 h-3.5 flex-shrink-0",
                            childActive ? "text-[#06B6D4]" : "text-neutral-400"
                          )}
                        />
                        {cl}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* User + Logout */}
      <div className="px-4 py-4 border-t border-neutral-100">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-full bg-[#06B6D4] flex items-center justify-center flex-shrink-0">
            <span className="text-xs font-bold text-white">RC</span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-neutral-800 truncate">Rafael Carvalho</p>
            <p className="text-[10px] text-neutral-400 truncate">Gestor Comercial</p>
          </div>
          <button
            onClick={handleLogout}
            title="Sair"
            className="p-1.5 rounded-md text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 transition-colors flex-shrink-0"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
        <p className="text-[10px] text-neutral-300">v1.0.0 — Beta</p>
      </div>
    </aside>
  );
}
