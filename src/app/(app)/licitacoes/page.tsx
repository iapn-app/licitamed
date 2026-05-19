import { supabase } from "@/lib/supabase";
import type { LicitacaoRow } from "@/lib/database.types";
import LicitacoesClient from "./licitacoes-client";

export const dynamic = "force-dynamic";

export default async function LicitacoesPage() {
  const { data } = await supabase
    .from("licitacoes")
    .select("*")
    .order("created_at", { ascending: false });

  const licitacoes: LicitacaoRow[] = data ?? [];

  return <LicitacoesClient initialData={licitacoes} />;
}
