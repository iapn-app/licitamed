/**
 * Gera um arquivo DOCX de referência (cotacao-modelo.docx) com a estrutura da cotação Power Med.
 * Usage: npx tsx src/scripts/criar-template-cotacao.ts
 */
import {
  Document, Packer, Paragraph, Table, TableRow, TableCell,
  TextRun, AlignmentType, WidthType, BorderStyle, VerticalAlign,
  TableLayoutType,
} from 'docx';
import { writeFileSync } from 'fs';
import path from 'path';

const POWER_MED = {
  nome: 'POWER MED MATERIAL HOSPITALAR LTDA',
  cnpj: '42.241.234/0001-70',
  ie: '12.10151-1',
  endereco: 'Estrada Pau Ferro, Nº 480 - Bloco 1 - Sala 401/402 - RJ - CEP: 22.743-051',
  tel: '21 3795-9747',
  email: 'powermedadm@gmail.com',
};

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
    bottom: { style: BorderStyle.NONE, size: 0, color: '000000' },
    left: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
    right: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
  };
}

function headerCell(text: string) {
  return new TableCell({
    children: [new Paragraph({
      children: [new TextRun({ text, bold: true, size: 18, font: 'Arial' })],
      alignment: AlignmentType.CENTER,
    })],
    verticalAlign: VerticalAlign.CENTER,
    shading: { fill: 'D9D9D9' },
    borders: thinBorder(),
    margins: { top: 60, bottom: 60, left: 80, right: 80 },
  });
}

function dataCell(text: string, center = false) {
  return new TableCell({
    children: [new Paragraph({
      children: [new TextRun({ text, size: 18, font: 'Arial' })],
      alignment: center ? AlignmentType.CENTER : AlignmentType.LEFT,
    })],
    verticalAlign: VerticalAlign.CENTER,
    borders: thinBorder(),
    margins: { top: 60, bottom: 60, left: 80, right: 80 },
  });
}

async function main() {
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
          spacing: { after: 200 },
        }),

        new Paragraph({
          border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: '000000' } },
          spacing: { after: 200 },
        }),

        // ── Título ──
        new Paragraph({
          children: [new TextRun({ text: 'COTAÇÃO DE PREÇOS Nº {{NUMERO}}', bold: true, size: 28, font: 'Arial' })],
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
                new TextRun({ text: '{{ORGAO}}', size: 18, font: 'Arial' }),
              ]})],
              borders: noBorder(), margins: { bottom: 80 },
            })]}),
            new TableRow({ children: [new TableCell({
              children: [new Paragraph({ children: [
                new TextRun({ text: 'OBJETO: ', bold: true, size: 18, font: 'Arial' }),
                new TextRun({ text: '{{OBJETO}}', size: 18, font: 'Arial' }),
              ]})],
              borders: noBorder(), margins: { bottom: 80 },
            })]}),
            new TableRow({ children: [new TableCell({
              children: [new Paragraph({ children: [
                new TextRun({ text: 'DATA: {{DATA}}', size: 18, font: 'Arial' }),
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
          rows: [
            new TableRow({
              tableHeader: true,
              children: [
                headerCell('ITEM'),
                headerCell('DESCRIÇÃO'),
                headerCell('APRESENTAÇÃO'),
                headerCell('UNID.'),
                headerCell('QUANT.'),
                headerCell('MARCA'),
                headerCell('VL.UNIT.'),
                headerCell('VL.TOTAL'),
              ],
            }),
            // 10 linhas em branco
            ...Array.from({ length: 10 }, (_, i) =>
              new TableRow({ children: [
                dataCell(String(i + 1), true),
                dataCell(''),
                dataCell(''),
                dataCell('', true),
                dataCell('', true),
                dataCell(''),
                dataCell('', true),
                dataCell('', true),
              ]}),
            ),
          ],
        }),

        new Paragraph({ spacing: { after: 300 } }),

        // ── Rodapé ──
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          layout: TableLayoutType.FIXED,
          rows: [new TableRow({ children: [
            new TableCell({
              children: [new Paragraph({ children: [
                new TextRun({ text: 'CONDIÇÕES DE PAGAMENTO: ', bold: true, size: 18, font: 'Arial' }),
                new TextRun({ text: '{{COND_PGTO}}', size: 18, font: 'Arial' }),
              ]})],
              borders: noBorder(),
            }),
            new TableCell({
              children: [new Paragraph({ children: [
                new TextRun({ text: 'FRETE: ', bold: true, size: 18, font: 'Arial' }),
                new TextRun({ text: '{{FRETE}}', size: 18, font: 'Arial' }),
              ]})],
              borders: noBorder(),
            }),
            new TableCell({
              children: [new Paragraph({ children: [
                new TextRun({ text: 'VALIDADE DA PROPOSTA: ', bold: true, size: 18, font: 'Arial' }),
                new TextRun({ text: '{{VALIDADE}}', size: 18, font: 'Arial' }),
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
  const outPath = path.resolve('cotacao-modelo.docx');
  writeFileSync(outPath, buffer);
  console.log(`Template gerado: ${outPath}`);
}

main().catch(console.error);
