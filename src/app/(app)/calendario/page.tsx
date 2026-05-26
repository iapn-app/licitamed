"use client";

import { useState, useEffect, useCallback } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, Download, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Evento {
  id: string;
  titulo: string;
  data: string;
  tipo: string;
  descricao?: string;
}

const TIPO_CONFIG: Record<string, { label: string; color: string; dot: string }> = {
  pregao:     { label: 'Pregão',           color: 'bg-blue-50 text-blue-700 border-blue-200',   dot: 'bg-blue-500' },
  prazo:      { label: 'Prazo recursal',   color: 'bg-red-50 text-red-700 border-red-200',      dot: 'bg-red-500' },
  entrega:    { label: 'Entrega',          color: 'bg-green-50 text-green-700 border-green-200', dot: 'bg-green-500' },
  pagamento:  { label: 'Pagamento',        color: 'bg-purple-50 text-purple-700 border-purple-200', dot: 'bg-purple-500' },
  vencimento: { label: 'Vencimento doc.',  color: 'bg-orange-50 text-orange-700 border-orange-200', dot: 'bg-orange-500' },
  reuniao:    { label: 'Reunião',          color: 'bg-neutral-50 text-neutral-700 border-neutral-200', dot: 'bg-neutral-400' },
};

const MESES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
const DIAS_SEMANA = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];

function toICS(eventos: Evento[]): string {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//LicitaMed//Power Med//PT',
    'CALSCALE:GREGORIAN',
  ];
  for (const e of eventos) {
    const dt = e.data.replace(/-/g, '');
    lines.push(
      'BEGIN:VEVENT',
      `UID:${e.id}@licitamed`,
      `DTSTART;VALUE=DATE:${dt}`,
      `DTEND;VALUE=DATE:${dt}`,
      `SUMMARY:${e.titulo}`,
      `DESCRIPTION:${e.descricao ?? ''}`,
      'END:VEVENT'
    );
  }
  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}

const LS_KEY = 'licitamed_calendario';

export default function CalendarioPage() {
  const today = new Date();
  const [mes, setMes] = useState(today.getMonth());
  const [ano, setAno] = useState(today.getFullYear());
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ titulo: '', data: '', tipo: 'pregao', descricao: '' });
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(LS_KEY);
      if (stored) setEventos(JSON.parse(stored) as Evento[]);
    } catch { /* ignore */ }
  }, []);

  const save = useCallback((evs: Evento[]) => {
    setEventos(evs);
    localStorage.setItem(LS_KEY, JSON.stringify(evs));
  }, []);

  function addEvento() {
    if (!form.titulo.trim() || !form.data) { toast.error('Título e data obrigatórios'); return; }
    const novo: Evento = { id: crypto.randomUUID(), titulo: form.titulo.trim(), data: form.data, tipo: form.tipo, descricao: form.descricao.trim() || undefined };
    save([...eventos, novo]);
    setForm({ titulo: '', data: '', tipo: 'pregao', descricao: '' });
    setShowModal(false);
    toast.success('Evento adicionado');
  }

  function removeEvento(id: string) {
    save(eventos.filter(e => e.id !== id));
    toast.success('Evento removido');
  }

  function exportICS() {
    const ics = toICS(eventos);
    const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'licitamed_calendario.ics'; a.click();
    URL.revokeObjectURL(url);
    toast.success('Calendário exportado para .ics');
  }

  // Calendar grid
  const primeiroDia = new Date(ano, mes, 1).getDay();
  const diasNoMes = new Date(ano, mes + 1, 0).getDate();
  const cells = Array.from({ length: primeiroDia + diasNoMes }, (_, i) => {
    if (i < primeiroDia) return null;
    return i - primeiroDia + 1;
  });

  const eventosPorDia = eventos.reduce<Record<string, Evento[]>>((acc, e) => {
    const d = e.data;
    if (!acc[d]) acc[d] = [];
    acc[d].push(e);
    return acc;
  }, {});

  function navMes(d: number) {
    const nm = mes + d;
    if (nm < 0) { setMes(11); setAno(a => a - 1); }
    else if (nm > 11) { setMes(0); setAno(a => a + 1); }
    else setMes(nm);
  }

  const toISO = (day: number) => `${ano}-${String(mes + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  const selectedEvs = selected ? (eventosPorDia[selected] ?? []) : [];
  const eventosMes = eventos.filter(e => e.data.startsWith(`${ano}-${String(mes + 1).padStart(2, '0')}`))
    .sort((a, b) => a.data.localeCompare(b.data));

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <CalendarDays className="w-5 h-5 text-[#06B6D4]" />
            <h1 className="text-xl font-semibold text-neutral-900">Calendário de Prazos</h1>
          </div>
          <p className="text-sm text-neutral-500">Pregões, entregas, vencimentos e prazos recursais</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={exportICS} disabled={eventos.length === 0} className="gap-1.5">
            <Download className="w-3.5 h-3.5" />Exportar .ics
          </Button>
          <Button size="sm" onClick={() => setShowModal(true)} className="gap-1.5">
            <Plus className="w-3.5 h-3.5" />Novo evento
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Calendar */}
        <div className="xl:col-span-2 bg-white rounded-lg border border-neutral-200 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-100">
            <button onClick={() => navMes(-1)} className="p-1.5 rounded hover:bg-neutral-100">
              <ChevronLeft className="w-4 h-4 text-neutral-500" />
            </button>
            <h2 className="text-sm font-semibold text-neutral-900">{MESES[mes]} {ano}</h2>
            <button onClick={() => navMes(1)} className="p-1.5 rounded hover:bg-neutral-100">
              <ChevronRight className="w-4 h-4 text-neutral-500" />
            </button>
          </div>
          <div className="grid grid-cols-7 border-b border-neutral-100">
            {DIAS_SEMANA.map(d => (
              <div key={d} className="py-2 text-center text-[10px] font-semibold text-neutral-400">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {cells.map((day, i) => {
              if (!day) return <div key={`empty-${i}`} className="min-h-[72px] border-b border-r border-neutral-50" />;
              const iso = toISO(day);
              const evs = eventosPorDia[iso] ?? [];
              const isToday = iso === today.toISOString().slice(0, 10);
              const isSelected = selected === iso;
              return (
                <div
                  key={day}
                  onClick={() => setSelected(isSelected ? null : iso)}
                  className={cn(
                    'min-h-[72px] p-1.5 border-b border-r border-neutral-50 cursor-pointer transition-colors',
                    isSelected ? 'bg-[#ECFEFF]' : 'hover:bg-neutral-50'
                  )}
                >
                  <span className={cn(
                    'text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full mb-1',
                    isToday ? 'bg-[#06B6D4] text-white' : 'text-neutral-700'
                  )}>
                    {day}
                  </span>
                  <div className="space-y-0.5">
                    {evs.slice(0, 2).map(e => {
                      const tc = TIPO_CONFIG[e.tipo];
                      return (
                        <div key={e.id} className={cn('w-2 h-2 rounded-full inline-block mr-0.5', tc?.dot ?? 'bg-neutral-400')} />
                      );
                    })}
                    {evs.length > 2 && <span className="text-[9px] text-neutral-400">+{evs.length - 2}</span>}
                  </div>
                </div>
              );
            })}
          </div>
          {/* Selected day events */}
          {selected && (
            <div className="border-t border-neutral-100 px-5 py-3">
              <p className="text-xs font-semibold text-neutral-700 mb-2">
                {new Date(selected + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
              </p>
              {selectedEvs.length === 0 && <p className="text-xs text-neutral-400">Nenhum evento neste dia</p>}
              {selectedEvs.map(e => {
                const tc = TIPO_CONFIG[e.tipo];
                return (
                  <div key={e.id} className="flex items-center gap-2 py-1.5">
                    <div className={cn('w-2 h-2 rounded-full flex-shrink-0', tc?.dot ?? 'bg-neutral-400')} />
                    <div className="flex-1">
                      <p className="text-xs font-medium text-neutral-800">{e.titulo}</p>
                      {e.descricao && <p className="text-[10px] text-neutral-400">{e.descricao}</p>}
                    </div>
                    <span className={cn('text-[9px] px-1.5 py-0.5 rounded-full border', tc?.color ?? '')}>{tc?.label}</span>
                    <button onClick={() => removeEvento(e.id)} className="text-neutral-300 hover:text-red-400">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Event list */}
        <div className="bg-white rounded-lg border border-neutral-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-neutral-100">
            <h3 className="text-sm font-semibold text-neutral-900">Eventos de {MESES[mes]}</h3>
          </div>
          <div className="divide-y divide-neutral-50 max-h-[500px] overflow-y-auto">
            {eventosMes.length === 0 && (
              <p className="text-xs text-neutral-400 px-5 py-6 text-center">Nenhum evento este mês</p>
            )}
            {eventosMes.map(e => {
              const tc = TIPO_CONFIG[e.tipo];
              const [, , dd] = e.data.split('-');
              return (
                <div key={e.id} className="flex items-start gap-3 px-4 py-3 hover:bg-neutral-50">
                  <div className="w-8 h-8 rounded-lg bg-neutral-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold text-neutral-600">{dd}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-neutral-800 line-clamp-1">{e.titulo}</p>
                    <span className={cn('text-[9px] px-1.5 py-0.5 rounded-full border inline-block mt-0.5', tc?.color ?? '')}>{tc?.label}</span>
                  </div>
                  <button onClick={() => removeEvento(e.id)} className="text-neutral-300 hover:text-red-400 flex-shrink-0">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-2">
        {Object.entries(TIPO_CONFIG).map(([key, cfg]) => (
          <span key={key} className="flex items-center gap-1.5 text-[10px] text-neutral-500">
            <div className={cn('w-2 h-2 rounded-full', cfg.dot)} />{cfg.label}
          </span>
        ))}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm">
            <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-100">
              <h2 className="text-sm font-semibold">Novo evento</h2>
              <button onClick={() => setShowModal(false)}><X className="w-4 h-4 text-neutral-400" /></button>
            </div>
            <div className="px-5 py-4 space-y-3">
              <div>
                <label className="text-xs font-medium text-neutral-600 mb-1 block">Título *</label>
                <Input value={form.titulo} onChange={e => setForm(f => ({ ...f, titulo: e.target.value }))} placeholder="Ex: Pregão HFSE 2025/015" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-neutral-600 mb-1 block">Data *</label>
                  <Input type="date" value={form.data} onChange={e => setForm(f => ({ ...f, data: e.target.value }))} />
                </div>
                <div>
                  <label className="text-xs font-medium text-neutral-600 mb-1 block">Tipo</label>
                  <Select value={form.tipo} onValueChange={v => setForm(f => ({ ...f, tipo: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(TIPO_CONFIG).map(([k, v]) => (
                        <SelectItem key={k} value={k}>{v.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-neutral-600 mb-1 block">Descrição</label>
                <Input value={form.descricao} onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))} placeholder="Opcional" />
              </div>
            </div>
            <div className="flex justify-end gap-2 px-5 py-4 border-t border-neutral-100">
              <Button variant="outline" size="sm" onClick={() => setShowModal(false)}>Cancelar</Button>
              <Button size="sm" onClick={addEvento} className="gap-1.5">
                <Plus className="w-3.5 h-3.5" />Adicionar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
