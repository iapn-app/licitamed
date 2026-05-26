"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Radio, AlertTriangle, Clock, Bell,
  Play, Square, ExternalLink, Settings, Volume2, VolumeX, Siren,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// ─── Sounds ──────────────────────────────────────────────────────────────────

function playPing() {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
    osc.start(); osc.stop(ctx.currentTime + 0.3);
  } catch { /* sem permissão de áudio */ }
}

function playAlarm() {
  try {
    const ctx = new AudioContext();
    [440, 880, 440, 880].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.4, ctx.currentTime + i * 0.2);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.2 + 0.18);
      osc.start(ctx.currentTime + i * 0.2);
      osc.stop(ctx.currentTime + i * 0.2 + 0.2);
    });
  } catch { /* sem permissão de áudio */ }
}

function playUrgente() {
  try {
    const ctx = new AudioContext();
    [660, 880, 660, 880, 660, 880].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.5, ctx.currentTime + i * 0.15);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.15 + 0.12);
      osc.start(ctx.currentTime + i * 0.15);
      osc.stop(ctx.currentTime + i * 0.15 + 0.15);
    });
  } catch { /* sem permissão de áudio */ }
}

// ─── Notifications ───────────────────────────────────────────────────────────

function notifyBrowser(titulo: string, corpo: string) {
  if (Notification.permission === 'granted') {
    new Notification(titulo, { body: corpo, icon: '/icons/icon-192.svg' });
  }
}

async function pedirPermissaoNotificacao() {
  if ('Notification' in window && Notification.permission === 'default') {
    await Notification.requestPermission();
  }
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface Config {
  pregaoUrl: string;
  pregaoNome: string;
  login: string;
  senha: string;
  intervaloMs: number;
  whatsapp: string;
  email: string;
}

interface LogEntry {
  ts: number;
  tipo: 'checkin' | 'alerta' | 'inicio' | 'encerrado' | 'info';
  msg: string;
}

const LS_CONFIG = 'licitamed_sala_config';
const LS_ATIVO = 'licitamed_sala_ativo';
const LS_ULTIMO = 'licitamed_sala_ultimo_checkin';

const INTERVALOS = [
  { label: '30 segundos', ms: 30_000 },
  { label: '1 minuto', ms: 60_000 },
  { label: '2 minutos', ms: 120_000 },
  { label: '5 minutos', ms: 300_000 },
];

function formatSeg(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return m > 0 ? `${m}m ${String(sec).padStart(2, '0')}s` : `${sec}s`;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function SalaDisputaPage() {
  const defaultConfig: Config = {
    pregaoUrl: '', pregaoNome: '', login: '', senha: '',
    intervaloMs: 120_000, whatsapp: '', email: '',
  };

  const [config, setConfig] = useState<Config>(defaultConfig);
  const [ativo, setAtivo] = useState(false);
  const [ultimoCheckin, setUltimoCheckin] = useState<number>(0);
  const [agora, setAgora] = useState(Date.now());
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [mutado, setMutado] = useState(false);
  const [notifPermissao, setNotifPermissao] = useState<NotificationPermission>('default');

  const ativoRef = useRef(ativo);
  const configRef = useRef(config);
  const mutadoRef = useRef(mutado);
  const ultimoCheckinRef = useRef(ultimoCheckin);
  const alertaDisparadoRef = useRef(false);

  ativoRef.current = ativo;
  configRef.current = config;
  mutadoRef.current = mutado;
  ultimoCheckinRef.current = ultimoCheckin;

  // Load from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(LS_CONFIG);
    if (saved) { try { setConfig(JSON.parse(saved) as Config); } catch { /* noop */ } }
    const wasAtivo = localStorage.getItem(LS_ATIVO) === 'true';
    const lastCheckin = parseInt(localStorage.getItem(LS_ULTIMO) ?? '0');
    if (wasAtivo && lastCheckin) {
      setAtivo(true);
      setUltimoCheckin(lastCheckin);
      addLog('info', 'Monitoramento restaurado após navegação');
    }
    setNotifPermissao(Notification.permission);
  }, []);

  function addLog(tipo: LogEntry['tipo'], msg: string) {
    setLogs(prev => [{ ts: Date.now(), tipo, msg }, ...prev].slice(0, 50));
  }

  // Clock tick
  useEffect(() => {
    const id = setInterval(() => setAgora(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  // Dead Man's Switch timer
  const enviarAlerta = useCallback(async (tipo: string, msg: string) => {
    const cfg = configRef.current;
    addLog('alerta', msg);
    if (!mutadoRef.current) playUrgente();
    notifyBrowser('⚠️ ALERTA Power Med', msg);

    if (cfg.whatsapp || cfg.email) {
      try {
        await fetch('/api/sala-disputa/alerta', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tipo,
            pregao: cfg.pregaoNome || cfg.pregaoUrl,
            mensagem: msg,
            whatsapp: cfg.whatsapp || undefined,
            email: cfg.email || undefined,
          }),
        });
      } catch { /* silencia erros de rede */ }
    }
  }, []);

  useEffect(() => {
    if (!ativo) { alertaDisparadoRef.current = false; return; }

    const id = setInterval(() => {
      if (!ativoRef.current) return;
      const decorrido = Date.now() - ultimoCheckinRef.current;
      const intervalo = configRef.current.intervaloMs;

      if (decorrido > intervalo && !alertaDisparadoRef.current) {
        alertaDisparadoRef.current = true;
        const minutos = Math.round(decorrido / 60000);
        enviarAlerta('checkin_perdido',
          `Ninguém confirmou presença há ${minutos} minuto${minutos !== 1 ? 's' : ''}. Verifique o pregão imediatamente!`
        );
      }
    }, 5000);

    return () => clearInterval(id);
  }, [ativo, enviarAlerta]);

  function iniciar() {
    if (!config.pregaoUrl && !config.pregaoNome) {
      toast.error('Informe a URL ou nome do pregão');
      return;
    }
    pedirPermissaoNotificacao().then(() => setNotifPermissao(Notification.permission));
    const now = Date.now();
    setAtivo(true);
    setUltimoCheckin(now);
    setLogs([]);
    alertaDisparadoRef.current = false;
    localStorage.setItem(LS_CONFIG, JSON.stringify(config));
    localStorage.setItem(LS_ATIVO, 'true');
    localStorage.setItem(LS_ULTIMO, String(now));
    addLog('inicio', `Monitoramento iniciado — ${config.pregaoNome || config.pregaoUrl}`);
    if (!mutado) playPing();
    toast.success('Monitoramento ativo! Clique "Estou aqui!" periodicamente.');
  }

  function encerrar() {
    setAtivo(false);
    localStorage.setItem(LS_ATIVO, 'false');
    addLog('encerrado', 'Monitoramento encerrado pelo usuário');
    toast.info('Monitoramento encerrado');
  }

  function confirmarPresenca() {
    const now = Date.now();
    setUltimoCheckin(now);
    localStorage.setItem(LS_ULTIMO, String(now));
    alertaDisparadoRef.current = false;
    addLog('checkin', 'Presença confirmada ✓');
    if (!mutado) playPing();
    toast.success('Presença confirmada!');
  }

  const tempoSemCheckin = ativo ? agora - ultimoCheckin : 0;
  const percentCheckin = ativo ? Math.min(100, (tempoSemCheckin / config.intervaloMs) * 100) : 0;
  const estaEmPerigo = percentCheckin >= 80;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className={cn('relative', ativo && 'animate-pulse')}>
              <Radio className="w-5 h-5 text-[#06B6D4]" />
              {ativo && <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-red-500 rounded-full" />}
            </div>
            <h1 className="text-xl font-semibold text-neutral-900">Sala de Disputa — Monitor</h1>
          </div>
          <p className="text-sm text-neutral-500">
            Dead Man&apos;s Switch para monitoramento de pregões BBMNET
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setMutado(m => !m)}
            className="p-2 rounded-md border border-neutral-200 text-neutral-500 hover:bg-neutral-50"
            title={mutado ? 'Ativar sons' : 'Silenciar sons'}
          >
            {mutado ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
          {notifPermissao !== 'granted' && (
            <button
              onClick={() => pedirPermissaoNotificacao().then(() => setNotifPermissao(Notification.permission))}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border border-orange-200 bg-orange-50 text-orange-700 hover:bg-orange-100"
            >
              <Bell className="w-3.5 h-3.5" />
              Permitir notificações
            </button>
          )}
        </div>
      </div>

      {/* Config panel */}
      {!ativo && (
        <div className="neon-card bg-white rounded-lg border border-neutral-200 shadow-card p-6 space-y-5">
          <div className="flex items-center gap-2 mb-1">
            <Settings className="w-4 h-4 text-neutral-400" />
            <h2 className="text-sm font-semibold text-neutral-900">Configuração do Monitoramento</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-neutral-600 mb-1.5 block">Nome do Pregão</label>
              <Input
                value={config.pregaoNome}
                onChange={e => setConfig(c => ({ ...c, pregaoNome: e.target.value }))}
                placeholder="Ex: Pregão 012/2026 — SES-RJ"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-neutral-600 mb-1.5 block">URL do Pregão (BBMNET)</label>
              <Input
                value={config.pregaoUrl}
                onChange={e => setConfig(c => ({ ...c, pregaoUrl: e.target.value }))}
                placeholder="https://sala.bbmnet.com.br/home/meuslotes?faseId=7"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-neutral-600 mb-1.5 block">Login BBMNET (opcional)</label>
              <Input
                value={config.login}
                onChange={e => setConfig(c => ({ ...c, login: e.target.value }))}
                placeholder="email@powermrd.com.br"
                type="email"
                autoComplete="off"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-neutral-600 mb-1.5 block">Senha BBMNET (apenas localStorage)</label>
              <Input
                value={config.senha}
                onChange={e => setConfig(c => ({ ...c, senha: e.target.value }))}
                placeholder="••••••••"
                type="password"
                autoComplete="new-password"
              />
              <p className="text-[10px] text-neutral-400 mt-1">Nunca enviada ao servidor · guardada apenas no browser</p>
            </div>
            <div>
              <label className="text-xs font-medium text-neutral-600 mb-1.5 block">Intervalo de confirmação</label>
              <Select
                value={String(config.intervaloMs)}
                onValueChange={v => setConfig(c => ({ ...c, intervaloMs: parseInt(v) }))}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {INTERVALOS.map(i => (
                    <SelectItem key={i.ms} value={String(i.ms)}>{i.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium text-neutral-600 mb-1.5 block">WhatsApp para alertas</label>
              <Input
                value={config.whatsapp}
                onChange={e => setConfig(c => ({ ...c, whatsapp: e.target.value }))}
                placeholder="+55 21 99999-9999"
                type="tel"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-neutral-600 mb-1.5 block">E-mail para alertas</label>
              <Input
                value={config.email}
                onChange={e => setConfig(c => ({ ...c, email: e.target.value }))}
                placeholder="responsavel@powermrd.com.br"
                type="email"
              />
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-md p-3 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-700">
              <strong>Dead Man&apos;s Switch:</strong> Se você não clicar em &quot;Estou aqui!&quot; dentro do intervalo configurado,
              o sistema envia alertas automáticos por WhatsApp e e-mail para garantir que alguém veja o pregão.
            </p>
          </div>

          <Button onClick={iniciar} className="gap-2 w-full sm:w-auto">
            <Play className="w-4 h-4" />
            Iniciar Monitoramento
          </Button>
        </div>
      )}

      {/* Active monitoring panel */}
      {ativo && (
        <div className="space-y-4">
          {/* Status + Dead Man's Switch */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Status */}
            <div className="neon-card bg-white rounded-lg border border-neutral-200 shadow-card p-5">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <p className="text-sm font-semibold text-neutral-900">Monitoramento Ativo</p>
              </div>
              <p className="text-xs text-neutral-500 truncate">{config.pregaoNome || config.pregaoUrl || 'Pregão não nomeado'}</p>
              <div className="mt-3 space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-neutral-500">Intervalo configurado</span>
                  <span className="font-medium text-neutral-900">{INTERVALOS.find(i => i.ms === config.intervaloMs)?.label}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-neutral-500">Último check-in</span>
                  <span className="font-medium text-neutral-900">{new Date(ultimoCheckin).toLocaleTimeString('pt-BR')}</span>
                </div>
                {config.pregaoUrl && (
                  <a
                    href={config.pregaoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-xs font-medium text-[#06B6D4] hover:text-[#0891B2] mt-2"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Abrir BBMNET
                  </a>
                )}
              </div>
              <Button variant="outline" size="sm" onClick={encerrar} className="mt-4 gap-2 w-full">
                <Square className="w-3.5 h-3.5 text-red-500" />
                Encerrar Monitoramento
              </Button>
            </div>

            {/* Dead Man's Switch */}
            <div className={cn(
              'rounded-lg border shadow-card p-5 flex flex-col items-center gap-4',
              estaEmPerigo ? 'bg-red-50 border-red-300' : 'bg-white border-neutral-200'
            )}>
              <div className="relative w-28 h-28">
                <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
                  <circle cx="60" cy="60" r="52" fill="none" stroke="#E5E7EB" strokeWidth="8" />
                  <circle
                    cx="60" cy="60" r="52" fill="none"
                    stroke={estaEmPerigo ? '#DC2626' : '#06B6D4'}
                    strokeWidth="8"
                    strokeDasharray={`${percentCheckin * 3.267} 326.7`}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  {estaEmPerigo
                    ? <Siren className="w-7 h-7 text-red-500 animate-pulse" />
                    : <Clock className="w-6 h-6 text-[#06B6D4]" />
                  }
                  <span className={cn('text-xs font-bold mt-1', estaEmPerigo ? 'text-red-600' : 'text-neutral-700')}>
                    {formatSeg(tempoSemCheckin)}
                  </span>
                </div>
              </div>

              {estaEmPerigo && (
                <p className="text-sm font-bold text-red-600 text-center animate-pulse">
                  ⚠️ CONFIRME SUA PRESENÇA!
                </p>
              )}

              <button
                onClick={confirmarPresenca}
                className={cn(
                  'w-full py-3 rounded-lg font-bold text-sm transition-all active:scale-95',
                  estaEmPerigo
                    ? 'bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-200 animate-bounce'
                    : 'bg-[#06B6D4] hover:bg-[#0891B2] text-white'
                )}
              >
                ✅ Estou aqui!
              </button>

              <p className="text-[10px] text-neutral-400 text-center">
                Clique a cada {INTERVALOS.find(i => i.ms === config.intervaloMs)?.label.toLowerCase() ?? '—'} para evitar alertas
              </p>
            </div>
          </div>

          {/* Notification test */}
          <div className="bg-white rounded-lg border border-neutral-200 p-4 flex flex-wrap items-center gap-3">
            <p className="text-xs font-medium text-neutral-700 flex-1">Testar alertas manualmente:</p>
            <button
              onClick={() => { if (!mutado) playPing(); toast.info('Novo lance simulado'); notifyBrowser('🔔 Novo Lance', 'Lance registrado no pregão'); }}
              className="text-xs px-3 py-1.5 rounded-md border border-neutral-200 hover:bg-neutral-50 font-medium text-neutral-700"
            >
              🔔 Simular lance
            </button>
            <button
              onClick={() => { if (!mutado) playAlarm(); toast.warning('Mensagem do pregoeiro!'); notifyBrowser('❗ Pregoeiro Falou', 'Nova mensagem no chat do pregão'); }}
              className="text-xs px-3 py-1.5 rounded-md border border-orange-200 bg-orange-50 hover:bg-orange-100 font-medium text-orange-700"
            >
              ❗ Simular pregoeiro
            </button>
            <button
              onClick={() => enviarAlerta('posicao_piorou', 'Sua posição piorou — você foi superado no lance!')}
              className="text-xs px-3 py-1.5 rounded-md border border-red-200 bg-red-50 hover:bg-red-100 font-medium text-red-700"
            >
              🚨 Simular alerta WhatsApp
            </button>
          </div>

          {/* Log */}
          {logs.length > 0 && (
            <div className="neon-card bg-white rounded-lg border border-neutral-200 shadow-card overflow-hidden">
              <div className="px-5 py-3 border-b border-neutral-100">
                <p className="text-sm font-semibold text-neutral-900">Histórico de Atividade</p>
              </div>
              <div className="divide-y divide-neutral-50 max-h-64 overflow-y-auto">
                {logs.map((log, i) => {
                  const colors: Record<string, string> = {
                    checkin: 'text-green-600',
                    alerta: 'text-red-600',
                    inicio: 'text-[#06B6D4]',
                    encerrado: 'text-neutral-400',
                    info: 'text-neutral-600',
                  };
                  const icons: Record<string, string> = {
                    checkin: '✓', alerta: '⚠️', inicio: '▶', encerrado: '■', info: '·',
                  };
                  return (
                    <div key={i} className="px-5 py-2 flex items-start gap-3">
                      <span className={cn('text-xs font-bold shrink-0 mt-0.5', colors[log.tipo])}>{icons[log.tipo]}</span>
                      <div className="min-w-0 flex-1">
                        <p className={cn('text-xs', colors[log.tipo])}>{log.msg}</p>
                        <p className="text-[10px] text-neutral-400">{new Date(log.ts).toLocaleTimeString('pt-BR')}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Info footer */}
      {!ativo && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
          <Bell className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
          <div className="text-xs text-blue-700 space-y-1">
            <p className="font-semibold">Como funciona o Dead Man&apos;s Switch:</p>
            <p>1. Configure o pregão e o intervalo de confirmação de presença</p>
            <p>2. Clique &quot;Iniciar Monitoramento&quot; e abra o BBMNET na mesma tela</p>
            <p>3. A cada intervalo, clique &quot;Estou aqui!&quot; para confirmar que está monitorando</p>
            <p>4. Se esquecer de confirmar, o sistema envia WhatsApp e e-mail de alerta automaticamente</p>
            <p className="font-semibold mt-2">Para alertas externos, configure TWILIO_ACCOUNT_SID e SENDGRID_API_KEY nas variáveis da Vercel</p>
          </div>
        </div>
      )}
    </div>
  );
}
