import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

function computeStatus(validade?: string, alertaDias = 30): string {
  if (!validade) return 'sem_data';
  const v = new Date(validade);
  const diasRestantes = Math.floor((v.getTime() - Date.now()) / 86400000);
  if (diasRestantes < 0) return 'vencido';
  if (diasRestantes <= alertaDias) return 'a_vencer';
  return 'valido';
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const body = await request.json() as Record<string, unknown>;
  const status = computeStatus(body.validade as string, (body.alerta_dias as number) ?? 30);

  const { data, error } = await supabase
    .from('documentos_habilitacao')
    .update({ ...body, status, updated_at: new Date().toISOString() })
    .eq('id', params.id)
    .select()
    .single();

  if (error) return NextResponse.json({ erro: error.message }, { status: 500 });
  return NextResponse.json({ documento: data });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { error } = await supabase
    .from('documentos_habilitacao')
    .delete()
    .eq('id', params.id);

  if (error) return NextResponse.json({ erro: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
