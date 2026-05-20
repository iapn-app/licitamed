import { Upload, FileText, CheckCircle2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";

const docs = [
  { nome: "Certidão Negativa Federal", validade: "2024-12-31", ok: true, tipo: "Regularidade Fiscal" },
  { nome: "Certidão Negativa Estadual SP", validade: "2024-11-30", ok: true, tipo: "Regularidade Fiscal" },
  { nome: "Certidão Negativa Municipal", validade: "2024-10-15", ok: true, tipo: "Regularidade Fiscal" },
  { nome: "FGTS — Certidão de Regularidade", validade: "2024-08-20", ok: false, tipo: "Regularidade Trabalhista" },
  { nome: "Certidão de Falência e Concordata", validade: "2025-01-15", ok: true, tipo: "Habilitação Jurídica" },
  { nome: "Contrato Social Consolidado", validade: "2025-05-01", ok: true, tipo: "Habilitação Jurídica" },
  { nome: "Balanço Patrimonial 2023", validade: "2025-04-30", ok: true, tipo: "Qualificação Econômica" },
  { nome: "Atestado de Capacidade Técnica", validade: "2025-06-30", ok: true, tipo: "Qualificação Técnica" },
];

const grouped = docs.reduce((acc, doc) => {
  if (!acc[doc.tipo]) acc[doc.tipo] = [];
  acc[doc.tipo].push(doc);
  return acc;
}, {} as Record<string, typeof docs>);

export default function DocumentosPage() {
  const vencidos = docs.filter((d) => !d.ok).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-neutral-900">Documentos</h1>
          <p className="text-sm text-neutral-500 mt-0.5">
            Gestão de documentação habilitatória
          </p>
        </div>
        <Button className="gap-2">
          <Upload className="w-4 h-4" />
          Upload documento
        </Button>
      </div>

      {vencidos > 0 && (
        <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
          <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <p className="text-sm text-red-700">
            <strong>{vencidos} documento(s)</strong> precisam de renovação urgente.
          </p>
        </div>
      )}

      {Object.entries(grouped).map(([tipo, items]) => (
        <div key={tipo} className="neon-card bg-white rounded-lg border border-neutral-200 shadow-card overflow-hidden">
          <div className="px-5 py-3 border-b border-neutral-100">
            <h3 className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">{tipo}</h3>
          </div>
          <table className="w-full">
            <tbody className="divide-y divide-neutral-50">
              {items.map((doc) => (
                <tr key={doc.nome} className="hover:bg-neutral-50 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <FileText className="w-4 h-4 text-neutral-300 flex-shrink-0" />
                      <span className="text-sm text-neutral-800">{doc.nome}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <span className="text-xs text-neutral-500">
                      Validade: <strong className={doc.ok ? "text-neutral-700" : "text-red-600"}>{formatDate(doc.validade)}</strong>
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-center w-32">
                    <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border font-medium ${doc.ok ? "bg-green-50 text-green-700 border-green-200" : "bg-red-50 text-red-700 border-red-200"}`}>
                      {doc.ok ? <CheckCircle2 className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                      {doc.ok ? "Válido" : "Vencido"}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <button className="text-xs text-[#06B6D4] hover:text-[#0891B2] transition-colors">
                      Substituir
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
}
