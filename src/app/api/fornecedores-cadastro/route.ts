import { NextRequest, NextResponse } from 'next/server';
import { adminSupabase, supabase as anonSupabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

function db() {
  return adminSupabase() ?? anonSupabase;
}

// GET /api/fornecedores-cadastro — lista todos com contagem de produtos
export async function GET() {
  const { data, error } = await db()
    .from('fornecedores_cadastro')
    .select(`
      id, nome_empresa, nome_contato, whatsapp, email, observacoes, ativo, created_at,
      fornecedores_produtos (id, produto, marca)
    `)
    .eq('ativo', true)
    .order('nome_empresa');

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

// POST /api/fornecedores-cadastro — criar fornecedor
export async function POST(req: NextRequest) {
  const body = await req.json() as {
    nome_empresa: string;
    nome_contato?: string;
    whatsapp?: string;
    email?: string;
    observacoes?: string;
  };

  if (!body.nome_empresa?.trim()) {
    return NextResponse.json({ error: 'nome_empresa obrigatório' }, { status: 400 });
  }

  const { data, error } = await db()
    .from('fornecedores_cadastro')
    .insert({
      nome_empresa: body.nome_empresa.trim(),
      nome_contato: body.nome_contato?.trim() || null,
      whatsapp: body.whatsapp?.trim() || null,
      email: body.email?.trim() || null,
      observacoes: body.observacoes?.trim() || null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
