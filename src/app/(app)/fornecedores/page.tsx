import { supabase } from "@/lib/supabase";
import type { FornecedorRow } from "@/lib/database.types";
import FornecedoresClient from "./fornecedores-client";

export const dynamic = "force-dynamic";

export default async function FornecedoresPage() {
  const { data } = await supabase
    .from("fornecedores")
    .select("*")
    .order("created_at", { ascending: false });

  const fornecedores: FornecedorRow[] = data ?? [];

  return <FornecedoresClient initialData={fornecedores} />;
}
