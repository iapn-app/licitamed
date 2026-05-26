import { NextRequest, NextResponse } from 'next/server';
import { adminSupabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const db = adminSupabase();
  if (!db) return NextResponse.json({ erro: 'Banco não configurado' }, { status: 500 });

  const body = await request.json() as { status?: string; observacao?: string; valor_extraido?: string };

  const { data: item, error: fetchErr } = await db
    .from('checklist_itens')
    .select('checklist_id')
    .eq('id', params.id)
    .single();

  if (fetchErr || !item) return NextResponse.json({ erro: 'Item não encontrado' }, { status: 404 });

  const { error } = await db
    .from('checklist_itens')
    .update(body)
    .eq('id', params.id);

  if (error) return NextResponse.json({ erro: error.message }, { status: 500 });

  // Recalculate progress on the parent checklist
  const { data: todos } = await db
    .from('checklist_itens')
    .select('status, obrigatorio')
    .eq('checklist_id', item.checklist_id);

  if (todos && todos.length > 0) {
    const obrigatorios = todos.filter(i => i.obrigatorio);
    const concluidos = obrigatorios.filter(i => i.status === 'ok').length;
    const progresso = obrigatorios.length > 0
      ? Math.round((concluidos / obrigatorios.length) * 100)
      : 0;

    const temCritico = todos.some(i => i.status === 'critico');
    const status = progresso === 100 ? 'pronto' : temCritico ? 'critico' : progresso > 0 ? 'em_andamento' : 'pendente';

    await db
      .from('checklists')
      .update({ progresso, status, atualizado_em: new Date().toISOString() })
      .eq('id', item.checklist_id);
  }

  return NextResponse.json({ ok: true });
}
