import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

export async function GET() {
  const hoje = new Date();
  const semanaAtras = new Date(hoje);
  semanaAtras.setDate(semanaAtras.getDate() - 7);
  const iso = (d: Date) => d.toISOString().slice(0, 10);

  const [{ data: licitacoes }, { data: cotacoes }] = await Promise.all([
    supabase.from('licitacoes').select('id,nome,status,valor_estimado,created_at').gte('created_at', semanaAtras.toISOString()),
    supabase.from('cotacoes').select('id,status,created_at').gte('created_at', semanaAtras.toISOString()),
  ]);

  const porStatus = (licitacoes ?? []).reduce<Record<string, number>>((acc, l) => {
    acc[l.status as string] = (acc[l.status as string] ?? 0) + 1;
    return acc;
  }, {});

  const valorTotal = (licitacoes ?? []).reduce((s, l) => s + ((l.valor_estimado as number) ?? 0), 0);

  return NextResponse.json({
    periodo: { inicio: iso(semanaAtras), fim: iso(hoje) },
    licitacoes: {
      total: (licitacoes ?? []).length,
      porStatus,
      valorTotal,
      lista: (licitacoes ?? []).slice(0, 10),
    },
    cotacoes: {
      total: (cotacoes ?? []).length,
    },
    geradoEm: new Date().toISOString(),
  });
}
