import "server-only";

const RESEND_URL = "https://api.resend.com/emails";

/** Adjunto para Resend: contenido en base64. */
export type EmailAttachment = { filename: string; content: string };

type Email = { to: string; subject: string; html: string; text: string; replyTo?: string; attachments?: EmailAttachment[] };

/**
 * Envío transaccional con la API REST de Resend (sin paquete extra: es un solo POST).
 * Nunca lanza: un correo caído no debe romper el cambio de estado del pedido.
 */
export async function sendEmail({ to, subject, html, text, replyTo, attachments }: Email): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (!apiKey || !from) {
    console.error("[email] Falta RESEND_API_KEY o EMAIL_FROM; no se envió el correo.");
    return false;
  }

  try {
    const res = await fetch(RESEND_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to: [to], subject, html, text, ...(replyTo ? { reply_to: replyTo } : {}),
        ...(attachments?.length ? { attachments } : {}),
      }),
    });
    if (!res.ok) {
      console.error("[email] Resend respondió", res.status, await res.text());
      return false;
    }
    return true;
  } catch (error) {
    console.error("[email] Error al llamar a Resend:", error instanceof Error ? error.message : error);
    return false;
  }
}
