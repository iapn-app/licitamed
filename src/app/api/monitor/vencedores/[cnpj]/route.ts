import { NextRequest, NextResponse } from 'next/server';
import { buscarContratosPNCP } from '@/lib/monitor/pncp';
import { classificarSegmento } from '@/lib/monitor/segmentos';

export const runtime = 'nodejs';
export const maxDuration = 30;

export async function GET(
  _req: NextRequest,
  { params }: { params: { cnpj: string } }
) {
  const cnpj = params.cnpj.replace(/\D/g, '');

  const [pncpData, cnpjData] = await Promise.allSettled([
    buscarContratosPNCP({ paginas: 10 }),
    fetch(`https://publica.cnpj.ws/cnpj/${cnpj}`, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(8000),
    }).then(r => r.ok ? r.json() : null),
  ]);

  // Find supplier in vencedores list
  const vencedor = pncpData.status === 'fulfilled'
    ? pncpData.value.vencedores.find(v => v.cnpj === cnpj)
    : null;

  if (!vencedor) {
    return NextResponse.json({ erro: 'Fornecedor não encontrado' }, { status: 404 });
  }

  // Enrich with CNPJ.ws data
  let dadosCnpj = null;
  if (cnpjData.status === 'fulfilled' && cnpjData.value) {
    const d = cnpjData.value as Record<string, unknown>;
    const est = d.estabelecimento as Record<string, unknown> | undefined;
    dadosCnpj = {
      razaoSocial: d.razao_social ?? vencedor.razaoSocial,
      nomeFantasia: est?.nome_fantasia ?? d.nome_fantasia,
      situacaoCadastral: est?.situacao_cadastral ?? d.situacao,
      telefone: est?.contato?.toString() ?? d.telefone,
      email: String(est?.contato ?? '') || String(d.email ?? ''),
      porte: d.porte?.toString(),
    };
  }

  // Contratos por ano
  const contratosDoFornecedor = pncpData.status === 'fulfilled'
    ? pncpData.value.contratos.filter(() => true) // placeholder — real filtering would need CNPJ per contract
    : [];

  return NextResponse.json({
    ...vencedor,
    ...(dadosCnpj ?? {}),
    contratos: contratosDoFornecedor.slice(0, 20),
    segmento: vencedor.segmento ?? classificarSegmento(vencedor.razaoSocial),
    timestamp: new Date().toISOString(),
  });
}
