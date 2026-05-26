import { NextRequest, NextResponse } from 'next/server';
import { adminSupabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const db = adminSupabase();
  if (!db) {
    console.error('[checklists] SUPABASE_SERVICE_ROLE_KEY não configurada');
    return NextResponse.json({ erro: 'Banco não configurado' }, { status: 500 });
  }

  const licitacaoId = request.nextUrl.searchParams.get('licitacaoId');

  let query = db
    .from('checklists')
    .select('id, licitacao_id, orgao, objeto, status, progresso, criado_em, atualizado_em')
    .order('criado_em', { ascending: false });

  if (licitacaoId) query = query.eq('licitacao_id', licitacaoId);

  const { data, error } = await query;
  if (error) {
    console.error('[checklists] Erro na query:', error.message, error.code);
    return NextResponse.json({ erro: error.message }, { status: 500 });
  }

  // Get item counts per checklist
  const ids = (data ?? []).map(c => c.id);
  const criticos: Record<string, number> = {};
  const totais: Record<string, number> = {};

  if (ids.length > 0) {
    const { data: itemData } = await db
      .from('checklist_itens')
      .select('checklist_id, status')
      .in('checklist_id', ids);

    for (const item of itemData ?? []) {
      totais[item.checklist_id] = (totais[item.checklist_id] ?? 0) + 1;
      if (item.status === 'critico') {
        criticos[item.checklist_id] = (criticos[item.checklist_id] ?? 0) + 1;
      }
    }
  }

  const result = (data ?? []).map(c => ({
    ...c,
    totalItens: totais[c.id] ?? 0,
    itensCriticos: criticos[c.id] ?? 0,
  }));

  return NextResponse.json(result);
}
