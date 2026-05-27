import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { adminSupabase } from "@/lib/supabase";

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

interface AIResult {
  tipo: "licitacoes" | "fornecedores" | "cotacoes" | "itens_licitacao" | "misto";
  confianca: number;
  registros: Record<string, unknown>[];
  campos_identificados: string[];
  resumo: string;
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "Nenhum arquivo enviado" }, { status: 400 });
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "Arquivo muito grande (máx 10 MB)" }, { status: 400 });
    }

    // Parse with SheetJS
    const bytes = await file.arrayBuffer();
    const workbook = XLSX.read(Buffer.from(bytes), { type: "buffer", cellText: true });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const sheetData = XLSX.utils.sheet_to_json(sheet, {
      header: 1,
      defval: "",
    }) as unknown[][];

    if (!sheetData || sheetData.length < 2) {
      return NextResponse.json(
        { error: "Planilha vazia ou sem linhas de dados" },
        { status: 400 }
      );
    }

    const totalLinhas = sheetData.length - 1;
    const preview = sheetData.slice(0, 50);

    // Gemini API (free tier — aistudio.google.com/apikey)
    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        {
          error:
            "GOOGLE_API_KEY não configurada. Obtenha grátis em aistudio.google.com/apikey e adicione no Vercel em Settings → Environment Variables.",
        },
        { status: 500 }
      );
    }

    const prompt = `Você é especialista em dados de distribuidoras hospitalares brasileiras.

Analise esta planilha e retorne APENAS um JSON válido (sem markdown, sem texto extra) com:
1. "tipo": um de "licitacoes", "fornecedores", "cotacoes", "itens_licitacao" ou "misto"
2. "confianca": 0-100
3. "registros": array com os dados normalizados (máx 100 itens)
4. "campos_identificados": nomes das colunas reconhecidas
5. "resumo": 1-2 frases descrevendo o conteúdo

Mapeamentos:
- licitacoes → nome, orgao, numero_processo, valor_estimado, data_pregao, status, uf, municipio, objeto
- fornecedores → nome, cnpj, email, whatsapp, categorias (array), uf, municipio
- cotacoes → item, fornecedor, preco_unitario, marca, prazo, unidade
- itens_licitacao → numero_item, descricao, quantidade, unidade, categoria

Planilha (${totalLinhas} linhas totais, mostrando ${preview.length - 1}):
${JSON.stringify(preview)}`;

    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.1, maxOutputTokens: 4096 },
        }),
        signal: AbortSignal.timeout(30000),
      }
    );

    if (!geminiRes.ok) {
      const txt = await geminiRes.text();
      return NextResponse.json(
        { error: `Gemini retornou ${geminiRes.status}: ${txt.slice(0, 300)}` },
        { status: 500 }
      );
    }

    const geminiData = (await geminiRes.json()) as {
      candidates: { content: { parts: { text: string }[] } }[];
    };
    const rawText =
      geminiData.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

    let analysis: AIResult;
    try {
      const match = rawText.match(/\{[\s\S]*\}/);
      analysis = JSON.parse(match ? match[0] : rawText) as AIResult;
    } catch {
      return NextResponse.json(
        { error: "IA não retornou JSON válido", raw: rawText.slice(0, 500) },
        { status: 500 }
      );
    }

    // Save to Supabase
    let importados = 0;
    let erroSalvar: string | null = null;

    const db = adminSupabase();
    if (db && analysis.registros?.length > 0) {
      try {
        if (analysis.tipo === "licitacoes") {
          const rows = analysis.registros.map((r) => ({
            nome: String(r.nome ?? r.orgao ?? "Licitação importada"),
            orgao: String(r.orgao ?? r.nome ?? "Órgão não informado"),
            numero_processo: r.numero_processo ? String(r.numero_processo) : null,
            valor_estimado: r.valor_estimado ? Number(r.valor_estimado) : null,
            data_pregao: r.data_pregao ? String(r.data_pregao) : null,
            status: "rascunho",
            progresso: 0,
            uf: r.uf ? String(r.uf) : null,
            municipio: r.municipio ? String(r.municipio) : null,
            objeto: r.objeto ? String(r.objeto) : null,
            edital_url: null,
            observacoes: "Importado via planilha",
          }));
          const { data: saved, error } = await db
            .from("licitacoes")
            .insert(rows)
            .select("id");
          if (error) erroSalvar = error.message;
          else importados = saved?.length ?? 0;
        } else if (analysis.tipo === "fornecedores") {
          const rows = analysis.registros.map((r) => ({
            nome: String(r.nome ?? "Fornecedor importado"),
            cnpj: r.cnpj ? String(r.cnpj) : null,
            email: r.email ? String(r.email) : null,
            whatsapp: r.whatsapp ? String(r.whatsapp) : null,
            categorias: Array.isArray(r.categorias)
              ? r.categorias.map(String)
              : null,
            score: 50,
            uf: r.uf ? String(r.uf) : null,
            municipio: r.municipio ? String(r.municipio) : null,
            observacoes: "Importado via planilha",
            ativo: true,
          }));
          const { data: saved, error } = await db
            .from("fornecedores")
            .insert(rows)
            .select("id");
          if (error) erroSalvar = error.message;
          else importados = saved?.length ?? 0;
        } else {
          importados = analysis.registros.length;
          erroSalvar = `Tipo "${analysis.tipo}" identificado — para salvar acesse a página correspondente`;
        }
      } catch (e) {
        erroSalvar = String(e);
      }
    }

    return NextResponse.json({
      success: true,
      filename: file.name,
      tipo: analysis.tipo,
      confianca: analysis.confianca,
      total_linhas: totalLinhas,
      registros_identificados: analysis.registros?.length ?? 0,
      registros_importados: importados,
      campos_identificados: analysis.campos_identificados ?? [],
      resumo: analysis.resumo,
      erro_salvar: erroSalvar,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
