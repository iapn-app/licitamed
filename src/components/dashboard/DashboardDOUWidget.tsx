"use client";

import { useState, useEffect } from "react";
import { Newspaper, ExternalLink, Bell } from "lucide-react";
import Link from "next/link";

interface DOUPublicacao {
  id: string;
  titulo: string;
  pubDate: string;
  urlTitle: string;
  secao: string;
  powerMed?: boolean;
}

const SECAO_COLORS: Record<string, string> = {
  DO1: 'text-blue-600 bg-blue-50',
  DO2: 'text-green-600 bg-green-50',
  DO3: 'text-orange-600 bg-orange-50',
};

function formatPubDate(d: string): string {
  if (!d) return '';
  try {
    const date = new Date(d.includes('T') ? d : d.replace(/(\d{2})\/(\d{2})\/(\d{4})/, '$3-$2-$1'));
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  } catch { return d.slice(0, 10); }
}

export function DashboardDOUWidget() {
  const [pubs, setPubs] = useState<DOUPublicacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [powerMedAlert, setPowerMedAlert] = useState(false);

  useEffect(() => {
    fetch('/api/dou/busca?q=hospitalar+OR+OPME+OR+material+m%C3%A9dico&secao=DO3&dias=3')
      .then(r => r.ok ? r.json() : null)
      .then((data: { publicacoes?: DOUPublicacao[]; powerMedAlerts?: number } | null) => {
        if (data?.publicacoes) {
          setPubs(data.publicacoes.slice(0, 5));
          setPowerMedAlert((data.powerMedAlerts ?? 0) > 0);
        }
      })
      .catch(() => null)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-2.5">
      {powerMedAlert && (
        <div className="flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-200 rounded-md">
          <Bell className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
          <p className="text-xs font-semibold text-red-700">Power Med mencionada no DOU hoje!</p>
        </div>
      )}

      {loading && (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-10 bg-neutral-100 rounded animate-pulse" />
          ))}
        </div>
      )}

      {!loading && pubs.length === 0 && (
        <p className="text-xs text-neutral-400 py-4 text-center">Nenhuma publicação recente</p>
      )}

      {!loading && pubs.map(pub => (
        <div key={pub.id} className="flex items-start gap-2 py-1.5">
          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded flex-shrink-0 mt-0.5 ${SECAO_COLORS[pub.secao] ?? 'text-neutral-500 bg-neutral-100'}`}>
            {pub.secao}
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-neutral-700 line-clamp-1 leading-snug">{pub.titulo || '(sem título)'}</p>
            {pub.pubDate && <p className="text-[10px] text-neutral-400">{formatPubDate(pub.pubDate)}</p>}
          </div>
          {pub.urlTitle && (
            <a
              href={`https://www.in.gov.br/web/dou/-/${pub.urlTitle}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-shrink-0 text-neutral-300 hover:text-[#06B6D4] transition-colors"
            >
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
      ))}

      <Link
        href="/dou"
        className="text-[10px] font-medium text-[#06B6D4] hover:text-[#0891B2] flex items-center gap-1"
      >
        <Newspaper className="w-3 h-3" />
        Ver todas no DOU
      </Link>
    </div>
  );
}
