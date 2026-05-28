import { NextRequest, NextResponse } from 'next/server';
import {
  Document, Packer, Paragraph, Table, TableRow, TableCell,
  TextRun, AlignmentType, WidthType, BorderStyle, VerticalAlign,
  TableLayoutType,
} from 'docx';
import { adminSupabase } from '@/lib/supabase';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const POWER_MED = {
  nome: 'POWER MED MATERIAL HOSPITALAR LTDA',
  cnpj: '42.241.234/0001-70',
  ie: '12.10151-1',
  endereco: 'Estrada Pau Ferro, Nº 480 - Bloco 1 - Sala 401/402 - RJ - CEP: 22.743-051',
  tel: '21 3795-9747',
  email: 'powermedadm@gmail.com',
};

interface ItemCotacao {
  descricao?: string;
  apresentacao?: string;
  unidade?: string;
  quantidade?: number;
  marca?: string;
  valorUnitario?: number;
}

function thinBorder() {
  return {
    top: { style: BorderStyle.SINGLE, size: 4, color: '000000' },
    bottom: { style: BorderStyle.SINGLE, size: 4, color: '000000' },
    left: { style: BorderStyle.SINGLE, size: 4, color: '000000' },
    right: { style: BorderStyle.SINGLE, size: 4, color: '000000' },
  };
}

function noBorder() {
  return {
    top: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
    bottom: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
    left: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
    right: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
  };
}

function hCell(text: string) {
  return new TableCell({
    children: [new Paragraph({
      children: [new TextRun({ text, bold: true, size: 16, font: 'Arial' })],
      alignment: AlignmentType.CENTER,
    })],
    verticalAlign: VerticalAlign.CENTER,
    shading: { fill: 'D9D9D9' },
    borders: thinBorder(),
    margins: { top: 60, bottom: 60, left: 80, right: 80 },
  });
}

function dCell(text: string, center = false) {
  return new TableCell({
    children: [new Paragraph({
      children: [new TextRun({ text, size: 16, font: 'Arial' })],
      alignment: center ? AlignmentType.CENTER : AlignmentType.LEFT,
    })],
    verticalAlign: VerticalAlign.CENTER,
    borders: thinBorder(),
    margins: { top: 60, bottom: 60, left: 80, right: 80 },
  });
}

function fmt(val?: number) {
  if (!val) return '';
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
}

function fmtDate(d: Date) {
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}


export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      checklistId: string;
      condicoesPgto?: string;
      frete?: string;
      validade?: string;
      itens?: ItemCotacao[];
    };

    const {
      checklistId,
      condicoesPgto = '30/60/90 dias',
      frete = 'CIF',
      validade = '15 dias úteis',
      itens = [],
    } = body;

    if (!checklistId) {
      return NextResponse.json({ error: 'checklistId obrigatório' }, { status: 400 });
    }

    const supabase = adminSupabase();
    let orgao = 'Não informado';
    let objeto = 'Não informado';

    if (supabase) {
      const { data } = await supabase
        .from('checklists')
        .select('orgao, objeto')
        .eq('id', checklistId)
        .single();
      if (data) { orgao = data.orgao ?? orgao; objeto = data.objeto ?? objeto; }
    }

    // Número da cotação: DDMMAA-HHMMSS para unicidade
    const now = new Date();
    const dd = String(now.getDate()).padStart(2, '0');
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const aa = String(now.getFullYear()).slice(2);
    const hh = String(now.getHours()).padStart(2, '0');
    const mi = String(now.getMinutes()).padStart(2, '0');
    const ss = String(now.getSeconds()).padStart(2, '0');
    const numero = `${dd}${mm}${aa}-${hh}${mi}${ss}`;
    const fileName = `cotacao-${numero}.docx`;

    // Linhas da tabela — usa itens fornecidos ou 10 linhas em branco
    const rows: ItemCotacao[] = itens.length > 0 ? itens : Array.from({ length: 10 }, () => ({}));

    const tableRows = [
      new TableRow({
        tableHeader: true,
        children: [
          hCell('ITEM'), hCell('DESCRIÇÃO'), hCell('APRESENTAÇÃO'),
          hCell('UNID.'), hCell('QUANT.'), hCell('MARCA'),
          hCell('VL.UNIT.'), hCell('VL.TOTAL'),
        ],
      }),
      ...rows.map((item, i) => {
        const total = item.quantidade && item.valorUnitario
          ? item.quantidade * item.valorUnitario : undefined;
        return new TableRow({ children: [
          dCell(String(i + 1), true),
          dCell(item.descricao ?? ''),
          dCell(item.apresentacao ?? ''),
          dCell(item.unidade ?? '', true),
          dCell(item.quantidade != null ? String(item.quantidade) : '', true),
          dCell(item.marca ?? ''),
          dCell(fmt(item.valorUnitario), true),
          dCell(fmt(total), true),
        ]});
      }),
    ];

    const doc = new Document({
      sections: [{
        properties: {
          page: { margin: { top: 720, bottom: 720, left: 1000, right: 1000 } },
        },
        children: [
          // ── Cabeçalho ──
          new Paragraph({
            children: [new TextRun({ text: POWER_MED.nome, bold: true, size: 28, font: 'Arial' })],
            alignment: AlignmentType.CENTER,
            spacing: { after: 80 },
          }),
          new Paragraph({
            children: [new TextRun({ text: `CNPJ: ${POWER_MED.cnpj}  |  IE: ${POWER_MED.ie}`, size: 18, font: 'Arial' })],
            alignment: AlignmentType.CENTER,
            spacing: { after: 60 },
          }),
          new Paragraph({
            children: [new TextRun({ text: POWER_MED.endereco, size: 18, font: 'Arial' })],
            alignment: AlignmentType.CENTER,
            spacing: { after: 60 },
          }),
          new Paragraph({
            children: [new TextRun({ text: `Tel: ${POWER_MED.tel}  |  E-mail: ${POWER_MED.email}`, size: 18, font: 'Arial' })],
            alignment: AlignmentType.CENTER,
            spacing: { after: 160 },
          }),

          new Paragraph({
            border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: '000000' } },
            spacing: { after: 200 },
          }),

          // ── Título ──
          new Paragraph({
            children: [new TextRun({ text: `COTAÇÃO DE PREÇOS Nº ${numero}`, bold: true, size: 26, font: 'Arial' })],
            alignment: AlignmentType.CENTER,
            spacing: { after: 240 },
          }),

          // ── Info ──
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            layout: TableLayoutType.FIXED,
            rows: [
              new TableRow({ children: [new TableCell({
                children: [new Paragraph({ children: [
                  new TextRun({ text: 'ÓRGÃO: ', bold: true, size: 18, font: 'Arial' }),
                  new TextRun({ text: orgao, size: 18, font: 'Arial' }),
                ]})],
                borders: noBorder(), margins: { bottom: 80 },
              })]}),
              new TableRow({ children: [new TableCell({
                children: [new Paragraph({ children: [
                  new TextRun({ text: 'OBJETO: ', bold: true, size: 18, font: 'Arial' }),
                  new TextRun({ text: objeto, size: 18, font: 'Arial' }),
                ]})],
                borders: noBorder(), margins: { bottom: 80 },
              })]}),
              new TableRow({ children: [new TableCell({
                children: [new Paragraph({ children: [
                  new TextRun({ text: `DATA: ${fmtDate(now)}`, size: 18, font: 'Arial' }),
                ]})],
                borders: noBorder(),
              })]}),
            ],
          }),

          new Paragraph({ spacing: { after: 200 } }),

          // ── Tabela de itens ──
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            layout: TableLayoutType.FIXED,
            rows: tableRows,
          }),

          new Paragraph({ spacing: { after: 300 } }),

          // ── Condições ──
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            layout: TableLayoutType.FIXED,
            rows: [new TableRow({ children: [
              new TableCell({
                children: [new Paragraph({ children: [
                  new TextRun({ text: 'CONDIÇÕES DE PAGAMENTO: ', bold: true, size: 18, font: 'Arial' }),
                  new TextRun({ text: condicoesPgto, size: 18, font: 'Arial' }),
                ]})],
                borders: noBorder(),
              }),
              new TableCell({
                children: [new Paragraph({ children: [
                  new TextRun({ text: 'FRETE: ', bold: true, size: 18, font: 'Arial' }),
                  new TextRun({ text: frete, size: 18, font: 'Arial' }),
                ]})],
                borders: noBorder(),
              }),
              new TableCell({
                children: [new Paragraph({ children: [
                  new TextRun({ text: 'VALIDADE: ', bold: true, size: 18, font: 'Arial' }),
                  new TextRun({ text: validade, size: 18, font: 'Arial' }),
                ]})],
                borders: noBorder(),
              }),
            ]})],
          }),

          new Paragraph({ spacing: { after: 700 } }),

          // ── Assinatura ──
          new Paragraph({
            children: [new TextRun({ text: '________________________________', size: 18, font: 'Arial' })],
            alignment: AlignmentType.CENTER,
            spacing: { after: 60 },
          }),
          new Paragraph({
            children: [new TextRun({ text: POWER_MED.nome, bold: true, size: 18, font: 'Arial' })],
            alignment: AlignmentType.CENTER,
            spacing: { after: 60 },
          }),
          new Paragraph({
            children: [new TextRun({ text: `CNPJ: ${POWER_MED.cnpj}`, size: 18, font: 'Arial' })],
            alignment: AlignmentType.CENTER,
          }),
        ],
      }],
    });

    const buffer = await Packer.toBuffer(doc);

    // Salvar no Supabase Storage (fire-and-forget)
    if (supabase) {
      supabase.storage
        .from('cotacoes')
        .upload(fileName, buffer, {
          contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          upsert: true,
        })
        .then(({ error }) => { if (error) console.error('Storage upload error:', error.message); })
        .catch(e => console.error('Storage upload failed:', e));
    }

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'X-Cotacao-Numero': numero,
      },
    });
  } catch (err) {
    console.error('Erro ao gerar cotação:', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
