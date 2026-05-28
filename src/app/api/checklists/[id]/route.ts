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

  // Match internal suppliers by keywords from objeto
  let fornecedoresInternos: Array<{
    fornecedor_id: string;
    nome_empresa: string;
    whatsapp: string | null;
    email: string | null;
    nome_contato: string | null;
    produto_match: string;
  }> = [];

  const objeto = (checklist.objeto ?? '') as string;
  if (objeto.length > 3) {
    const keywords = objeto
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length >= 5)
      .slice(0, 10); // limit search terms

    if (keywords.length > 0) {
      const { data: matchedProdutos } = await db
        .from('fornecedores_produtos')
        .select(`
          produto, marca,
          fornecedores_cadastro!inner (id, nome_empresa, whatsapp, email, nome_contato, ativo)
        `)
        .or(keywords.map(kw => `produto.ilike.%${kw}%`).join(','));

      // Deduplicate by fornecedor, pick best matching product
      const seen = new Set<string>();
      for (const row of matchedProdutos ?? []) {
        const fc = (row as unknown as { fornecedores_cadastro: { id: string; nome_empresa: string; whatsapp: string | null; email: string | null; nome_contato: string | null; ativo: boolean } }).fornecedores_cadastro;
        if (!fc.ativo || seen.has(fc.id)) continue;
        seen.add(fc.id);
        fornecedoresInternos.push({
          fornecedor_id: fc.id,
          nome_empresa: fc.nome_empresa,
          whatsapp: fc.whatsapp,
          email: fc.email,
          nome_contato: fc.nome_contato,
          produto_match: row.produto,
        });
      }
    }
  }

  return NextResponse.json({ ...checklist, itens: itens ?? [], categorias, fornecedoresInternos });
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
