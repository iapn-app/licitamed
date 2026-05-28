import { NextRequest, NextResponse } from 'next/server';
import { adminSupabase, supabase as anonSupabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

function db() {
  return adminSupabase() ?? anonSupabase;
}

// PATCH /api/fornecedores-cadastro/[id] — atualizar fornecedor
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json() as {
    nome_empresa?: string;
    nome_contato?: string;
    whatsapp?: string;
    email?: string;
    observacoes?: string;
    ativo?: boolean;
    produtos?: Array<{ id?: string; produto: string; marca?: string }>;
  };

  const client = db();

  // Update fornecedor fields
  const updateFields: Record<string, unknown> = {};
  if (body.nome_empresa !== undefined) updateFields.nome_empresa = body.nome_empresa.trim();
  if (body.nome_contato !== undefined) updateFields.nome_contato = body.nome_contato?.trim() || null;
  if (body.whatsapp !== undefined) updateFields.whatsapp = body.whatsapp?.trim() || null;
  if (body.email !== undefined) updateFields.email = body.email?.trim() || null;
  if (body.observacoes !== undefined) updateFields.observacoes = body.observacoes?.trim() || null;
  if (body.ativo !== undefined) updateFields.ativo = body.ativo;

  if (Object.keys(updateFields).length > 0) {
    const { error } = await client
      .from('fornecedores_cadastro')
      .update(updateFields)
      .eq('id', params.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Sync produtos if provided
  if (body.produtos !== undefined) {
    // Delete all and re-insert (simpler than diffing)
    await client.from('fornecedores_produtos').delete().eq('fornecedor_id', params.id);
    if (body.produtos.length > 0) {
      const rows = body.produtos
        .filter(p => p.produto?.trim())
        .map(p => ({
          fornecedor_id: params.id,
          produto: p.produto.trim(),
          marca: p.marca?.trim() || null,
        }));
      if (rows.length > 0) {
        const { error } = await client.from('fornecedores_produtos').insert(rows);
        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      }
    }
  }

  return NextResponse.json({ ok: true });
}

// DELETE /api/fornecedores-cadastro/[id] — soft delete
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const { error } = await db()
    .from('fornecedores_cadastro')
    .update({ ativo: false })
    .eq('id', params.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
