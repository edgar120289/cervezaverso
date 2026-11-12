/**
 * Dibuja una pieza de redes (foto real de la cerveza + frase corta) en un canvas.
 * Es solo presentación: nunca inventa datos, todo viene del producto elegido.
 * Reglas del plan de campaña: 70 % imagen, poco texto, fondos y acomodos que rotan,
 * sin personas ni imperativos de consumo, con la leyenda sanitaria siempre visible.
 */

export const LEYENDA = "El abuso en el consumo de este producto es nocivo para la salud. +18";

export type PostFormat = "feed" | "historia";
export type PostLayout = "tarjeta" | "directo" | "dividida";

export type Palette = { id: string; label: string; bg: string; bg2: string; text: string; accent: string; light: boolean };

export const PALETTES: Palette[] = [
  { id: "violeta", label: "Violeta", bg: "#5433eb", bg2: "#3a1fb8", text: "#ffffff", accent: "#ffd23f", light: false },
  { id: "crema", label: "Crema", bg: "#f4ead8", bg2: "#e8d9bd", text: "#1b1b1b", accent: "#5433eb", light: true },
  { id: "carbon", label: "Carbón", bg: "#161616", bg2: "#2a2a2a", text: "#ffffff", accent: "#ffb703", light: false },
  { id: "ambar", label: "Ámbar", bg: "#f6a413", bg2: "#d9480f", text: "#1b1b1b", accent: "#ffffff", light: true },
  { id: "lupulo", label: "Lúpulo", bg: "#2d6a4f", bg2: "#1b4332", text: "#ffffff", accent: "#ffd23f", light: false },
];

export const LAYOUTS: { id: PostLayout; label: string }[] = [
  { id: "tarjeta", label: "Tarjeta centrada" },
  { id: "directo", label: "Foto sobre el color" },
  { id: "dividida", label: "Mitad y mitad" },
];

export type PostOptions = {
  format: PostFormat;
  layout: PostLayout;
  palette: Palette;
  /** Frase corta de arriba, p. ej. «La encuentras en». */
  kicker: string;
  /** Nombre de la cerveza, ya en formato normal. */
  name: string;
  /** Precio ya formateado, p. ej. «$130». Vacío = no se muestra. */
  price: string;
  photo: ImageBitmap;
};

export const POST_SIZE: Record<PostFormat, { w: number; h: number }> = {
  feed: { w: 1080, h: 1350 },
  historia: { w: 1080, h: 1920 },
};

const FONT = 'Inter, system-ui, -apple-system, "Segoe UI", sans-serif';

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

/** Parte un texto en líneas que quepan en `maxWidth`. */
function wrap(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const lines: string[] = [];
  let line = "";
  for (const word of text.split(/\s+/).filter(Boolean)) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else line = test;
  }
  if (line) lines.push(line);
  return lines;
}

/** Dibuja texto en varias líneas y devuelve la `y` donde termina. */
function paragraph(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number, maxLines = 3) {
  const lines = wrap(ctx, text, maxWidth).slice(0, maxLines);
  lines.forEach((l, i) => ctx.fillText(l, x, y + i * lineHeight));
  return y + lines.length * lineHeight;
}

/** Mayor tamaño de letra (hasta `start`) con el que el texto cabe en `maxWidth`. */
function fit(ctx: CanvasRenderingContext2D, text: string, weight: number, maxWidth: number, start: number): number {
  let size = start;
  while (size > 20) {
    ctx.font = `${weight} ${size}px ${FONT}`;
    if (ctx.measureText(text).width <= maxWidth) break;
    size -= 2;
  }
  return size;
}

function drawContain(ctx: CanvasRenderingContext2D, img: ImageBitmap, x: number, y: number, w: number, h: number) {
  const s = Math.min(w / img.width, h / img.height);
  const dw = img.width * s;
  const dh = img.height * s;
  ctx.drawImage(img, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh);
}

function drawFooter(ctx: CanvasRenderingContext2D, o: PostOptions, W: number, H: number) {
  const { palette: p } = o;
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = p.text;
  ctx.globalAlpha = 0.78;
  ctx.font = `500 21px ${FONT}`;
  ctx.textAlign = "left";
  const legendBottom = o.format === "historia" ? H - 190 : H - 46;
  const lines = wrap(ctx, LEYENDA, 600);
  lines.forEach((l, i) => ctx.fillText(l, 64, legendBottom - (lines.length - 1 - i) * 27));
  ctx.globalAlpha = 1;
  ctx.font = `800 28px ${FONT}`;
  ctx.textAlign = "right";
  ctx.fillText("cervezaverso.com", W - 64, legendBottom);
  ctx.textAlign = "left";
}

function drawName(ctx: CanvasRenderingContext2D, o: PostOptions, x: number, y: number, maxWidth: number, size: number) {
  const { palette: p } = o;
  ctx.fillStyle = p.text;
  ctx.font = `800 ${size}px ${FONT}`;
  const end = paragraph(ctx, o.name, x, y, maxWidth, size * 1.08, 2);
  if (o.price) {
    ctx.fillStyle = p.accent;
    ctx.font = `800 ${Math.round(size * 0.9)}px ${FONT}`;
    ctx.fillText(o.price, x, end + size * 0.15);
    return end + size * 1.05;
  }
  return end;
}

export function renderPost(canvas: HTMLCanvasElement, o: PostOptions) {
  const { w: W, h: H } = POST_SIZE[o.format];
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Tu navegador no pudo dibujar la imagen.");
  const p = o.palette;
  const story = o.format === "historia";
  // Zonas que la interfaz de Instagram tapa en historias.
  const topSafe = story ? 230 : 0;

  const g = ctx.createLinearGradient(0, 0, W, H);
  g.addColorStop(0, p.bg);
  g.addColorStop(1, p.bg2);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  ctx.textBaseline = "alphabetic";
  ctx.textAlign = "left";

  const kicker = o.kicker.trim();

  if (o.layout === "tarjeta") {
    // Foto dentro de una tarjeta blanca de esquinas redondas: respeta el fondo blanco de las fotos.
    const cardW = W - 160;
    const cardH = story ? 980 : 760;
    const cardX = 80;
    const cardY = topSafe + 230;
    ctx.fillStyle = p.text;
    ctx.font = `800 34px ${FONT}`;
    ctx.globalAlpha = 0.85;
    ctx.fillText(kicker.toUpperCase(), 80, topSafe + 120);
    ctx.globalAlpha = 1;
    ctx.font = `900 82px ${FONT}`;
    ctx.fillText("cervezaverso.com", 80, topSafe + 196);
    ctx.save();
    ctx.shadowColor = "rgba(0,0,0,.28)";
    ctx.shadowBlur = 40;
    ctx.shadowOffsetY = 18;
    ctx.fillStyle = "#ffffff";
    roundRect(ctx, cardX, cardY, cardW, cardH, 28);
    ctx.fill();
    ctx.restore();
    drawContain(ctx, o.photo, cardX + 30, cardY + 30, cardW - 60, cardH - 60);
    drawName(ctx, o, 80, cardY + cardH + 86, W - 160, 48);
  } else if (o.layout === "directo") {
    // La foto se funde con el color (multiplica el blanco) sobre un círculo de luz.
    const headW = W - 160;
    const phrase = kicker || "La encuentras en";
    ctx.fillStyle = p.text;
    const size = Math.min(fit(ctx, phrase, 900, headW, story ? 96 : 88), fit(ctx, "cervezaverso.com", 900, headW, story ? 96 : 88));
    ctx.font = `900 ${size}px ${FONT}`;
    let y = topSafe + 150;
    ctx.fillText(phrase, 80, y);
    y += size * 1.08;
    ctx.fillStyle = p.accent;
    ctx.fillText("cervezaverso.com", 80, y);
    const cy = story ? 1020 : 740;
    const r = story ? 380 : 330;
    ctx.beginPath();
    ctx.arc(W / 2, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(255,255,255,.22)";
    ctx.fill();
    const ph = story ? 700 : 540;
    ctx.save();
    ctx.globalCompositeOperation = p.light ? "multiply" : "source-over";
    if (!p.light) {
      ctx.fillStyle = "#ffffff";
      roundRect(ctx, W / 2 - 290, cy - ph / 2 - 20, 580, ph + 40, 28);
      ctx.fill();
    }
    drawContain(ctx, o.photo, W / 2 - 330, cy - ph / 2, 660, ph);
    ctx.restore();
    drawName(ctx, o, 80, cy + ph / 2 + (story ? 130 : 100), W - 160, 44);
  } else {
    // Mitad y mitad: arriba el mensaje, abajo la foto en una tarjeta que sangra por el borde.
    const split = story ? 860 : 520;
    ctx.fillStyle = p.text;
    ctx.font = `800 32px ${FONT}`;
    ctx.globalAlpha = 0.85;
    ctx.fillText(kicker.toUpperCase(), 80, topSafe + 110);
    ctx.globalAlpha = 1;
    const size = fit(ctx, "cervezaverso.com", 900, W - 160, story ? 110 : 100);
    ctx.font = `900 ${size}px ${FONT}`;
    ctx.fillText("cervezaverso.com", 80, topSafe + 110 + size * 1.25);
    ctx.fillStyle = "#ffffff";
    roundRect(ctx, 60, split, W - 120, H - split + 60, 28);
    ctx.fill();
    drawContain(ctx, o.photo, 100, split + 30, W - 200, H - split - (story ? 450 : 330));
    // Nombre y precio sobre la tarjeta blanca, siempre en negro.
    const base = { ...o, palette: { ...p, text: "#111111", accent: "#5433eb" } };
    drawName(ctx, base, 100, H - (story ? 380 : 270), W - 200, 40);
  }

  drawFooter(
    ctx,
    o.layout === "dividida" ? { ...o, palette: { ...p, text: "#111111" } } : o,
    W,
    H,
  );
}

export async function cargarFoto(url: string): Promise<ImageBitmap> {
  const res = await fetch(url, { mode: "cors" });
  if (!res.ok) throw new Error("No se pudo descargar la foto del producto.");
  return createImageBitmap(await res.blob());
}
