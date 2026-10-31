import { HEALTH_NOTICE, LEGAL, SITE } from "@/lib/site";

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
        ${esc(LEGAL.razonSocial)} · RFC ${esc(LEGAL.rfc)}<br>
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

export type EstadoEmailInput = {
  nombre: string;
  folio: string;
  total: string;
  pedidoUrl: string;
  /** Monto ya formateado; solo si el pedido tuvo descuento por volumen. */
  descuentoVolumen?: string;
  /** Guía de envío; se muestra en el correo «Enviado». */
  guia?: { paqueteria: string; numero: string; url?: string | null } | null;
};

const ESTADO_EMAIL = {
  Pagado: {
    subject: "Recibimos tu pago",
    title: "¡Pago confirmado!",
    message: "Recibimos tu pago y ya estamos preparando tu pedido.",
  },
  Enviado: {
    subject: "Tu pedido va en camino",
    title: "¡Tu pedido va en camino!",
    message: "Tu pedido ya salió de nuestras manos. Recuerda tener una identificación oficial a la mano: la pedimos al entregar.",
  },
  Cancelado: {
    subject: "Tu pedido fue cancelado",
    title: "Pedido cancelado",
    message: "Tu pedido fue cancelado. Si no lo esperabas o tienes dudas, escríbenos por WhatsApp y lo revisamos contigo.",
  },
} as const;

export type EstadoConCorreo = keyof typeof ESTADO_EMAIL;

export function esEstadoConCorreo(estado: string): estado is EstadoConCorreo {
  return estado in ESTADO_EMAIL;
}

/** Correo de cambio de estado del pedido: pago confirmado, enviado o cancelado. */
export function estadoPedidoEmail(estado: EstadoConCorreo, { nombre, folio, total, pedidoUrl, descuentoVolumen, guia }: EstadoEmailInput) {
  const copy = ESTADO_EMAIL[estado];
  const conGuia = estado === "Enviado" && guia?.numero ? guia : null;
  const guiaHtml = conGuia
    ? `<p style="margin:0 0 8px;font-size:14px;color:${MUTED};">Tu guía de rastreo</p>
      <p style="margin:0 0 24px;padding:16px;border-radius:20px;background:${CANVAS};font-size:16px;line-height:1.6;">
        <strong>${esc(conGuia.paqueteria)}</strong><br><span style="font-size:20px;font-weight:700;letter-spacing:0.04em;">${esc(conGuia.numero)}</span>${
          conGuia.url ? `<br><a href="${esc(conGuia.url)}" style="color:${ACCENT};font-weight:600;">Rastrear mi paquete</a>` : ""
        }
      </p>`
    : "";
  const guiaTexto = conGuia ? `\nGuía: ${conGuia.paqueteria} ${conGuia.numero}${conGuia.url ? ` · Rastrear: ${conGuia.url}` : ""}` : "";
  const subject = `${copy.subject} · pedido #${folio} · ${SITE.name}`;
  const html = emailLayout({
    title: copy.title,
    bodyHtml: `
      <p style="margin:0 0 16px;font-size:16px;line-height:1.6;">Hola ${esc(nombre)}, ${esc(copy.message)}</p>
      <p style="margin:0 0 24px;padding:16px;border-radius:20px;background:${CANVAS};font-size:14px;line-height:1.8;">
        Pedido <strong>#${esc(folio)}</strong><br>${descuentoVolumen ? `Descuento por volumen (10%): <strong>−${esc(descuentoVolumen)}</strong><br>` : ""}Total: <strong>${esc(total)}</strong>
      </p>
      ${guiaHtml}
      <a href="${esc(pedidoUrl)}" style="display:inline-block;padding:14px 28px;border-radius:9999px;background:${ACCENT};color:#fff;font-weight:600;text-decoration:none;">Ver mi pedido</a>`,
  });
  const descuentoTexto = descuentoVolumen ? ` · Descuento por volumen (10%): −${descuentoVolumen}` : "";
  const text = `Hola ${nombre}, ${copy.message}\nPedido #${folio}${descuentoTexto} · Total: ${total}${guiaTexto}\nVer pedido: ${pedidoUrl}\n\n${HEALTH_NOTICE}`;
  return { subject, html, text };
}

/** Por qué se avisa al dueño de un pedido. */
export type MotivoAvisoAdmin = "pagado" | "transferencia" | "pagado_cancelado" | "pago_duplicado";

const AVISO_ADMIN: Record<MotivoAvisoAdmin, { subject: string; title: string; message: string; alerta: boolean }> = {
  pagado: {
    subject: "Nuevo pedido pagado",
    title: "Nuevo pedido pagado",
    message: "Mercado Pago confirmó el pago. Prepáralo para entregar a tiempo.",
    alerta: false,
  },
  transferencia: {
    subject: "Nuevo pedido por transferencia",
    title: "Pedido por transferencia",
    message: "El cliente pagará por transferencia. Cuando veas el depósito, márcalo como Pagado en el panel.",
    alerta: false,
  },
  pagado_cancelado: {
    subject: "ATENCIÓN: pago de un pedido cancelado",
    title: "Cobro de un pedido cancelado",
    message: "Mercado Pago aprobó un pago de este pedido, pero está Cancelado. Reactívalo y entrégalo, o reembolsa el pago desde Mercado Pago.",
    alerta: true,
  },
  pago_duplicado: {
    subject: "ATENCIÓN: segundo pago de un pedido",
    title: "Segundo pago del mismo pedido",
    message: "Mercado Pago aprobó otro pago de un pedido que ya estaba cobrado. Revisa en Mercado Pago y reembolsa el duplicado.",
    alerta: true,
  },
};

export type AvisoAdminInput = {
  folio: string;
  cliente: string;
  email: string;
  telefono: string;
  total: string;
  metodoPago: string;
  envio: string;
  direccion: string;
  lineas: string[];
  adminUrl: string;
  /** Id del pago en Mercado Pago, en los avisos de anomalías. */
  pagoId?: string;
};

/** Aviso interno al dueño de la tienda: pedido nuevo o anomalía de cobro. */
export function avisoPedidoAdminEmail(motivo: MotivoAvisoAdmin, data: AvisoAdminInput) {
  const copy = AVISO_ADMIN[motivo];
  const subject = `${copy.subject} · #${data.folio} · ${data.total}`;
  const filas: [string, string][] = [
    ["Pedido", `#${data.folio}`],
    ["Cliente", data.cliente],
    ["Correo", data.email],
    ["Teléfono", data.telefono],
    ["Total", data.total],
    ["Pago", data.metodoPago],
    ["Envío", data.envio],
    ["Dirección", data.direccion],
    ...(data.pagoId ? ([["Pago de Mercado Pago", data.pagoId]] as [string, string][]) : []),
  ];
  const html = emailLayout({
    title: copy.title,
    bodyHtml: `
      <p style="margin:0 0 16px;font-size:16px;line-height:1.6;${copy.alerta ? "color:#b42318;font-weight:600;" : ""}">${esc(copy.message)}</p>
      <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;margin:0 0 16px;font-size:14px;line-height:1.6;">
        ${filas.map(([k, v]) => `<tr><td style="padding:4px 12px 4px 0;color:${MUTED};vertical-align:top;white-space:nowrap;">${esc(k)}</td><td style="padding:4px 0;">${esc(v)}</td></tr>`).join("")}
      </table>
      <p style="margin:0 0 8px;font-size:14px;color:${MUTED};">Cervezas</p>
      <p style="margin:0 0 24px;padding:16px;border-radius:20px;background:${CANVAS};font-size:14px;line-height:1.8;">${data.lineas.map(esc).join("<br>")}</p>
      <a href="${esc(data.adminUrl)}" style="display:inline-block;padding:14px 28px;border-radius:9999px;background:${ACCENT};color:#fff;font-weight:600;text-decoration:none;">Abrir en el panel</a>`,
  });
  const text = [
    copy.message,
    "",
    ...filas.map(([k, v]) => `${k}: ${v}`),
    "",
    "Cervezas:",
    ...data.lineas,
    "",
    `Panel: ${data.adminUrl}`,
  ].join("\n");
  return { subject, html, text };
}
