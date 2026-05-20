import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Cria cliente com service role key para bypassar RLS no DELETE
function adminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) return null;
  return createClient(url, serviceKey, { auth: { persistSession: false } });
}

export async function DELETE() {
  const admin = adminClient();

  if (!admin) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "SUPABASE_SERVICE_ROLE_KEY não configurada. Adicione ao .env.local e às variáveis de ambiente do Vercel.",
      },
      { status: 500 }
    );
  }

  const tables = [
    "cotacao_itens",
    "cotacoes",
    "itens_licitacao",
    "licitacoes",
    "fornecedores",
  ];

  const results: Record<string, unknown> = {};
  for (const table of tables) {
    const { error, count } = await admin
      .from(table)
      .delete({ count: "exact" })
      .not("id", "is", null);
    results[table] = error ? { error: error.message } : { deleted: count };
  }

  return NextResponse.json({ ok: true, results });
}

export async function POST() {
  return NextResponse.json(
    { error: "Seed de dados desativado. Use DELETE para limpar o banco." },
    { status: 405 }
  );
}

export async function GET() {
  return NextResponse.json(
    { error: "Use DELETE para limpar o banco." },
    { status: 405 }
  );
}
