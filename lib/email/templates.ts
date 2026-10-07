import { HEALTH_NOTICE, SITE } from "@/lib/site";

const ACCENT = "#5433eb";
const CANVAS = "#f2f4f5";
const MUTED = "#666361";

function esc(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

/** Estructura base de todos los correos: marca, contenido y leyendas obligatorias. */
export function emailLayout({ title, bodyHtml }: { title: string; bodyHtml: string }): string {
  return `<!doctype html>
<html lang="es-MX">
<body style="margin:0;padding:24px 12px;background:${CANVAS};font-family:Inter,Arial,sans-serif;color:#000;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#fff;border-radius:28px;overflow:hidden;">
      <tr><td style="background:${ACCENT};padding:24px 32px;color:#fff;font-size:20px;font-weight:700;letter-spacing:-0.03em;">${esc(SITE.name)}</td></tr>
      <tr><td style="padding:32px;">
        <h1 style="margin:0 0 16px;font-size:24px;letter-spacing:-0.04em;">${esc(title)}</h1>
        ${bodyHtml}
      </td></tr>
      <tr><td style="padding:20px 32px;background:${CANVAS};font-size:12px;color:${MUTED};line-height:1.5;">
        ${esc(HEALTH_NOTICE)} Venta exclusiva a mayores de 18 años. Disfruta con responsabilidad.<br>
        <a href="${SITE.url}" style="color:${ACCENT};">${esc(SITE.url.replace(/^https?:\/\//, ""))}</a>
      </td></tr>
    </table>
  </td></tr></table>
</body>
</html>`;
}

export type PremioEmail = { nombre: string; nivel: number; premio: string; code: string };

/** Correo de «Premio desbloqueado»: felicitación y código del cupón. */
export function premioDesbloqueadoEmail({ nombre, nivel, premio, code }: PremioEmail) {
  const subject = `¡Desbloqueaste ${premio}! · ${SITE.name}`;
  const cuentaUrl = `${SITE.url}/cuenta`;
  const html = emailLayout({
    title: "¡Premio desbloqueado!",
    bodyHtml: `
      <p style="margin:0 0 16px;font-size:16px;line-height:1.6;">Hola ${esc(nombre)}, llegaste a <strong>${nivel} botellas</strong> en Cervezaverso. ¡Felicidades! Tu premio es:</p>
      <p style="margin:0 0 20px;font-size:20px;font-weight:700;color:${ACCENT};">${esc(premio)}</p>
      <p style="margin:0 0 8px;font-size:14px;color:${MUTED};">Tu código de recompensa</p>
      <p style="margin:0 0 24px;padding:16px;border-radius:20px;background:${CANVAS};font-size:20px;font-weight:700;letter-spacing:0.04em;text-align:center;">${esc(code)}</p>
      <p style="margin:0 0 24px;font-size:14px;line-height:1.6;color:${MUTED};">Es personal, de un solo uso y se canjea con tu siguiente pedido: escríbenos con tu código y lo agregamos. También lo encuentras siempre en tu cuenta.</p>
      <a href="${cuentaUrl}" style="display:inline-block;padding:14px 28px;border-radius:9999px;background:${ACCENT};color:#fff;font-weight:600;text-decoration:none;">Ver mi progreso</a>`,
  });
  const text = `Hola ${nombre}, llegaste a ${nivel} botellas en Cervezaverso. Tu premio: ${premio}.\nCódigo: ${code}\nEs personal, de un solo uso y se canjea escribiéndonos con tu siguiente pedido. Míralo en ${cuentaUrl}\n\n${HEALTH_NOTICE}`;
  return { subject, html, text };
}
