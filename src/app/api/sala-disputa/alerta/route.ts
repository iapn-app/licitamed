import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

interface AlertaPayload {
  tipo: 'checkin_perdido' | 'lance' | 'mensagem_pregoeiro' | 'posicao_piorou' | 'fase_mudou';
  pregao: string;
  mensagem: string;
  whatsapp?: string;
  email?: string;
}

async function enviarWhatsApp(para: string, mensagem: string): Promise<boolean> {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_WHATSAPP_FROM ?? 'whatsapp:+14155238886';

  if (!sid || !token) return false;

  const numero = para.startsWith('whatsapp:') ? para : `whatsapp:+55${para.replace(/\D/g, '')}`;

  try {
    const res = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`,
      {
        method: 'POST',
        headers: {
          Authorization: `Basic ${Buffer.from(`${sid}:${token}`).toString('base64')}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({ From: from, To: numero, Body: mensagem }),
      }
    );
    return res.ok;
  } catch {
    return false;
  }
}

async function enviarEmail(para: string, assunto: string, corpo: string): Promise<boolean> {
  const key = process.env.SENDGRID_API_KEY;
  const from = process.env.ALERT_EMAIL_FROM ?? 'alertas@powermred.com.br';

  if (!key) return false;

  try {
    const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: para }] }],
        from: { email: from },
        subject: assunto,
        content: [{ type: 'text/plain', value: corpo }],
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  let payload: AlertaPayload;
  try {
    payload = await request.json() as AlertaPayload;
  } catch {
    return NextResponse.json({ erro: 'JSON inválido' }, { status: 400 });
  }

  const { tipo, pregao, mensagem, whatsapp, email } = payload;

  const prefixos: Record<string, string> = {
    checkin_perdido: '⚠️ ALERTA Power Med',
    lance: '🔔 Novo Lance',
    mensagem_pregoeiro: '❗ Pregoeiro Falou',
    posicao_piorou: '🚨 URGENTE — Posição Piorou',
    fase_mudou: '📢 Fase do Pregão Mudou',
  };

  const prefixo = prefixos[tipo] ?? '🔔 Alerta';
  const textoCompleto = `${prefixo}\nPregão: ${pregao}\n${mensagem}\n\n— Power Med Automático`;

  const resultados = await Promise.all([
    whatsapp ? enviarWhatsApp(whatsapp, textoCompleto) : Promise.resolve(false),
    email ? enviarEmail(email, `${prefixo} — ${pregao}`, textoCompleto) : Promise.resolve(false),
  ]);

  return NextResponse.json({
    enviado: { whatsapp: resultados[0], email: resultados[1] },
    configurado: {
      twilio: !!process.env.TWILIO_ACCOUNT_SID,
      sendgrid: !!process.env.SENDGRID_API_KEY,
    },
    timestamp: new Date().toISOString(),
  });
}
