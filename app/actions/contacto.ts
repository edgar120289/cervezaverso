"use server";

import { createClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email/resend";
import { emailLayout } from "@/lib/email/templates";
import { guardPublicForm } from "@/lib/security/form-guard";
import { contactSchema, firstIssue } from "@/lib/validation";
import { CONTACT } from "@/lib/site";

export type ContactResult = { ok: true } | { ok: false; error: string };

function esc(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

/**
 * Consulta de /faq: se envía a contacto@cervezaverso.com con el correo del cliente como respuesta.
 * Con sesión, el correo sale de Supabase en el servidor (el del formulario se ignora); sin sesión es obligatorio.
 */
export async function enviarConsulta(input: unknown): Promise<ContactResult> {
  const parsed = contactSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: firstIssue(parsed.error) };
  const { email, mensaje, website, turnstileToken } = parsed.data;

  const guard = await guardPublicForm("contact", { honeypot: website, turnstileToken });
  if (!guard.ok) return guard;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const remitente = user?.email ?? email;
  if (!remitente) return { ok: false, error: "Escribe tu correo electrónico para que podamos responderte." };

  const enviado = await sendEmail({
    to: CONTACT.email,
    replyTo: remitente,
    subject: "Consulta desde cervezaverso.com",
    html: emailLayout({
      title: "Nueva consulta",
      bodyHtml: `<p style="margin:0 0 8px;"><strong>De:</strong> ${esc(remitente)}${user ? " (cliente con sesión)" : ""}</p><p style="margin:0;white-space:pre-wrap;">${esc(mensaje)}</p>`,
    }),
    text: `De: ${remitente}${user ? " (cliente con sesión)" : ""}\n\n${mensaje}`,
  });
  if (!enviado) {
    return { ok: false, error: `No pudimos enviar tu consulta. Escríbenos por WhatsApp al ${CONTACT.whatsappLabel}.` };
  }
  return { ok: true };
}
