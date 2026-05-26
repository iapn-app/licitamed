import { NextRequest, NextResponse } from 'next/server';
import { adminSupabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const db = adminSupabase();
  if (!db) return NextResponse.json({ erro: 'Banco não configurado' }, { status: 500 });

  const { data: checklist, error } = await db
    .from('checklists')
    .select('*')
    .eq('id', params.id)
    .single();

  if (error || !checklist) return NextResponse.json({ erro: 'Checklist não encontrado' }, { status: 404 });

  const { data: itens } = await db
    .from('checklist_itens')
    .select('*')
    .eq('checklist_id', params.id)
    .order('ordem', { ascending: true });

  // Group by category
  const categorias: Record<string, typeof itens> = {};
  for (const item of itens ?? []) {
    if (!categorias[item.categoria]) categorias[item.categoria] = [];
    categorias[item.categoria]!.push(item);
  }

  return NextResponse.json({ ...checklist, itens: itens ?? [], categorias });
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const db = adminSupabase();
  if (!db) return NextResponse.json({ erro: 'Banco não configurado' }, { status: 500 });

  const body = await request.json() as { status?: string; progresso?: number };

  const { error } = await db
    .from('checklists')
    .update({ ...body, atualizado_em: new Date().toISOString() })
    .eq('id', params.id);

  if (error) return NextResponse.json({ erro: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
