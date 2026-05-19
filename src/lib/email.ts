export interface AlertEmailPayload {
  to: string;
  subject: string;
  editaisEncontrados: Array<{
    orgao: string;
    objeto: string;
    valor: number;
    uf: string;
  }>;
}

// TODO Fase 2: integrar com Resend
// await resend.emails.send({ from, to, subject, html })
export async function sendAlertEmail(payload: AlertEmailPayload): Promise<void> {
  console.log("Email de alerta simulado:", {
    to: payload.to,
    subject: payload.subject,
    editaisEncontrados: payload.editaisEncontrados,
  });
}
