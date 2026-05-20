"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Activity,
  Eye,
  EyeOff,
  LogIn,
  Mail,
  Lock,
  Radio,
  TrendingUp,
  ClipboardCheck,
  Loader2,
} from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!email.trim() || !password.trim()) {
      setError("Preencha e-mail e senha.");
      return;
    }

    setLoading(true);
    await new Promise((r) => setTimeout(r, 700));

    if (
      email.trim().toLowerCase() !== "rafael@powermed.com.br" ||
      password !== "1234"
    ) {
      setLoading(false);
      setError("E-mail ou senha incorretos. Verifique suas credenciais.");
      return;
    }

    localStorage.setItem(
      "licitamed_user",
      JSON.stringify({ email: email.trim(), name: "Rafael Carvalho", role: "Gestor Comercial" })
    );
    router.push("/");
  }

  return (
    <div className="min-h-screen flex">
      {/* ── LEFT PANEL ──────────────────────────────────────────────── */}
      <div
        className="hidden md:flex md:w-[55%] relative flex-col overflow-hidden"
        style={{
          background: "linear-gradient(135deg, #0891B2 0%, #0e6685 50%, #164E63 100%)",
        }}
      >
        {/* Decorative circles — top right */}
        <div
          className="pointer-events-none absolute -top-24 -right-24 w-96 h-96 rounded-full"
          style={{ background: "rgba(255,255,255,0.07)" }}
        />
        <div
          className="pointer-events-none absolute top-12 -right-12 w-52 h-52 rounded-full"
          style={{ background: "rgba(255,255,255,0.05)" }}
        />
        {/* Decorative circles — bottom left */}
        <div
          className="pointer-events-none absolute -bottom-32 -left-20 w-80 h-80 rounded-full"
          style={{ background: "rgba(255,255,255,0.07)" }}
        />
        <div
          className="pointer-events-none absolute bottom-16 -left-8 w-44 h-44 rounded-full"
          style={{ background: "rgba(255,255,255,0.05)" }}
        />

        {/* Logo — top left */}
        <div className="relative z-10 px-10 pt-10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-md bg-white/20 flex items-center justify-center">
              <Activity className="w-4.5 h-4.5 text-white" strokeWidth={2.5} />
            </div>
            <span className="text-sm font-bold text-white tracking-wide">POWER MED</span>
          </div>
        </div>

        {/* Main content — vertically centered */}
        <div className="relative z-10 flex-1 flex flex-col justify-center px-10 py-12">
          {/* Badge */}
          <div className="mb-10">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium text-white border border-white/20 bg-white/10">
              Sistema Exclusivo · Desenvolvido por Rafael Carvalho
            </span>
          </div>

          {/* Hero headline */}
          <h1 className="text-4xl font-bold text-white leading-tight mb-6 tracking-tight">
            Da planilha ao pregão.<br />
            Do edital ao pagamento.<br />
            Tudo em um só lugar.
          </h1>

          {/* Subtitle */}
          <p className="text-base text-white/80 leading-relaxed max-w-md mb-12">
            A central inteligente de licitações hospitalares da POWER MED — do monitoramento de editais até o recebimento do pagamento.
          </p>

          {/* Feature bullets */}
          <div className="space-y-6">
            {[
              {
                Icon: Radio,
                title: "Monitor PNCP",
                desc: "Editais novos detectados em tempo real",
              },
              {
                Icon: TrendingUp,
                title: "Preço Vencedor IA",
                desc: "Simule cenários antes de enviar a proposta",
              },
              {
                Icon: ClipboardCheck,
                title: "Execução Total",
                desc: "Do empenho ao pagamento controlado",
              },
            ].map(({ Icon, title, desc }) => (
              <div key={title} className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Icon className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{title}</p>
                  <p className="text-xs text-white/65 mt-0.5">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="relative z-10 px-10 pb-8">
          <p className="text-[11px] text-white/50">
            POWER MED Material Hospitalar LTDA · CNPJ 42.241.234/0001-70
          </p>
        </div>
      </div>

      {/* ── RIGHT PANEL ─────────────────────────────────────────────── */}
      <div className="flex-1 md:w-[45%] flex flex-col items-center justify-center bg-white px-6 py-12">
        {/* Mobile-only logo */}
        <div className="flex md:hidden items-center gap-2.5 mb-10">
          <div className="w-9 h-9 rounded-md bg-[#06B6D4] flex items-center justify-center">
            <Activity className="w-5 h-5 text-white" strokeWidth={2.5} />
          </div>
          <span className="text-xl font-bold text-neutral-900 tracking-tight">POWER MED</span>
        </div>

        <div className="w-full max-w-sm">
          {/* Form heading */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-neutral-900">Bem-vindo de volta</h2>
            <p className="text-sm text-neutral-500 mt-1.5 leading-snug">
              Entre com suas credenciais para acessar o sistema
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label className="text-xs font-semibold text-neutral-600 mb-1.5 block uppercase tracking-wide">
                E-mail
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
                <input
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  className="w-full pl-10 pr-4 py-2.5 text-sm text-neutral-900 bg-white border border-neutral-200 rounded-lg placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#06B6D4] focus:border-transparent transition-shadow"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="text-xs font-semibold text-neutral-600 mb-1.5 block uppercase tracking-wide">
                Senha
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  className="w-full pl-10 pr-10 py-2.5 text-sm text-neutral-900 bg-white border border-neutral-200 rounded-lg placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#06B6D4] focus:border-transparent transition-shadow"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-start gap-2.5 bg-red-50 border border-red-100 rounded-lg px-3.5 py-3">
                <div className="w-1.5 h-1.5 rounded-full bg-red-400 mt-1.5 flex-shrink-0" />
                <p className="text-xs text-red-600 leading-relaxed">{error}</p>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 text-sm font-semibold text-white bg-[#06B6D4] hover:bg-[#0891B2] disabled:opacity-60 disabled:cursor-not-allowed rounded-lg transition-colors"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Entrando...
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  Entrar
                </>
              )}
            </button>
          </form>

          {/* Footer note */}
          <p className="text-center text-xs text-neutral-400 mt-8">
            Acesso restrito · POWER MED
          </p>
        </div>
      </div>
    </div>
  );
}
