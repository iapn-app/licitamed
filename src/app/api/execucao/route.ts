import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET() {
  const { data, error } = await supabase
    .from('contratos_execucao')
    .select('*, contratos_entregas(*)')
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ erro: error.message }, { status: 500 });
  return NextResponse.json({ contratos: data ?? [] });
}

export async function POST(request: NextRequest) {
  const body = await request.json() as Record<string, unknown>;
  if (!body.orgao || !body.objeto || !body.valor_total) {
    return NextResponse.json({ erro: 'orgao, objeto e valor_total são obrigatórios' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('contratos_execucao')
    .insert({ ...body, updated_at: new Date().toISOString() })
    .select()
    .single();

  if (error) return NextResponse.json({ erro: error.message }, { status: 500 });
  return NextResponse.json({ contrato: data }, { status: 201 });
}
