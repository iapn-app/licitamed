import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET() {
  const { data, error } = await supabase
    .from('documentos_habilitacao')
    .select('*')
    .order('tipo')
    .order('nome');

  if (error) return NextResponse.json({ erro: error.message }, { status: 500 });
  return NextResponse.json({ documentos: data ?? [] });
}

export async function POST(request: NextRequest) {
  const body = await request.json() as {
    nome?: string; tipo?: string; validade?: string;
    alerta_dias?: number; arquivo_url?: string; arquivo_nome?: string; observacoes?: string;
  };

  if (!body.nome?.trim() || !body.tipo?.trim()) {
    return NextResponse.json({ erro: 'nome e tipo são obrigatórios' }, { status: 400 });
  }

  const status = computeStatus(body.validade, body.alerta_dias ?? 30);

  const { data, error } = await supabase
    .from('documentos_habilitacao')
    .insert({ ...body, status, updated_at: new Date().toISOString() })
    .select()
    .single();

  if (error) return NextResponse.json({ erro: error.message }, { status: 500 });
  return NextResponse.json({ documento: data }, { status: 201 });
}

function computeStatus(validade?: string, alertaDias = 30): string {
  if (!validade) return 'sem_data';
  const v = new Date(validade);
  const hoje = new Date();
  const diasRestantes = Math.floor((v.getTime() - hoje.getTime()) / 86400000);
  if (diasRestantes < 0) return 'vencido';
  if (diasRestantes <= alertaDias) return 'a_vencer';
  return 'valido';
}
