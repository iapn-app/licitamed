import { NextResponse } from "next/server";
import { adminSupabase } from "@/lib/supabase";

export const dynamic = 'force-dynamic';

export async function DELETE() {
  const admin = adminSupabase();

  if (!admin) {
    return NextResponse.json(
      { ok: false, error: "SUPABASE_SERVICE_ROLE_KEY não configurada." },
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
    { error: "Seed desativado. Use DELETE para limpar o banco." },
    { status: 405 }
  );
}

export async function GET() {
  return NextResponse.json(
    { error: "Use DELETE para limpar o banco." },
    { status: 405 }
  );
}
