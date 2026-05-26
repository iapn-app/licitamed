import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET() {
  const { data, error } = await supabase
    .from('municipios_crm')
    .select('*, municipios_interacoes(*)')
    .order('updated_at', { ascending: false });
  if (error) return NextResponse.json({ erro: error.message }, { status: 500 });
  return NextResponse.json({ municipios: data ?? [] });
}

export async function POST(request: NextRequest) {
  const body = await request.json() as Record<string, unknown>;
  if (!body.municipio || !body.uf) {
    return NextResponse.json({ erro: 'municipio e uf são obrigatórios' }, { status: 400 });
  }
  const { data, error } = await supabase
    .from('municipios_crm')
    .insert({ ...body, updated_at: new Date().toISOString() })
    .select()
    .single();
  if (error) return NextResponse.json({ erro: error.message }, { status: 500 });
  return NextResponse.json({ municipio: data }, { status: 201 });
}
