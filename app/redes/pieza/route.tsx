import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import sharp from "sharp";
import { getProductBySku } from "@/lib/catalog";
import { formatMXN } from "@/lib/pricing";
import { FRASES } from "@/lib/redes-frases";
import { Pieza, PIEZA_PALETAS, PIEZA_SIZE, type PiezaFormato, type PiezaLayout } from "@/lib/redes-pieza";
import { normalCase } from "@/lib/text-case";

export const runtime = "nodejs";
export const maxDuration = 30;

const LAYOUTS: PiezaLayout[] = ["a", "b", "c", "d"];
const FONT_WEIGHTS = [500, 800, 900] as const;

let fontsPromise: Promise<{ name: string; data: Buffer; weight: (typeof FONT_WEIGHTS)[number]; style: "normal" }[]> | null = null;
function loadFonts() {
  fontsPromise ??= Promise.all(
    FONT_WEIGHTS.map(async (weight) => ({
      name: "Inter",
      data: await readFile(join(process.cwd(), "assets/fonts", `inter-latin-${weight}-normal.woff`)),
      weight,
      style: "normal" as const,
    })),
  );
  return fontsPromise;
}

/**
 * Pieza de redes (JPG) con la foto real de una cerveza activa: `?sku=&l=a|b|c|d&p=<paleta>&f=feed|historia&t=<frase>&precio=0|1`.
 * Pública porque Instagram y Facebook descargan la imagen al publicar; por eso el texto sale solo de `FRASES`
 * y el producto debe estar activo (una cerveza desactivada responde 404 y la publicación no sale).
 */
export async function GET(request: Request) {
  const q = new URL(request.url).searchParams;
  const sku = (q.get("sku") ?? "").slice(0, 200);
  const layout = (LAYOUTS as string[]).includes(q.get("l") ?? "") ? (q.get("l") as PiezaLayout) : "a";
  const paleta = PIEZA_PALETAS[q.get("p") ?? ""] ?? PIEZA_PALETAS.violeta;
  const formato: PiezaFormato = q.get("f") === "historia" ? "historia" : "feed";
  const frase = FRASES[q.get("t") ?? ""] ?? FRASES.encuentras;

  const product = sku ? await getProductBySku(sku) : null;
  if (!product || !product.image_url) return new Response("No encontrada", { status: 404 });

  try {
    const res = await fetch(product.image_url, { signal: AbortSignal.timeout(10000) });
    if (!res.ok) throw new Error(`foto ${res.status}`);
    // Recorta el margen blanco, limita el tamaño y aplana sobre blanco: Satori no lee WebP ni AVIF.
    const { data, info } = await sharp(Buffer.from(await res.arrayBuffer()))
      .flatten({ background: "#ffffff" })
      .trim({ threshold: 12 })
      .resize(900, 900, { fit: "inside", withoutEnlargement: true })
      .jpeg({ quality: 90 })
      .toBuffer({ resolveWithObject: true });

    const size = PIEZA_SIZE[formato];
    const png = await new ImageResponse(
      (
        <Pieza
          formato={formato}
          layout={layout}
          paleta={paleta}
          kicker={frase.kicker}
          big={frase.big}
          name={normalCase(product.name)}
          detail={`${normalCase(product.style)} · ${normalCase(product.country)}`}
          price={q.get("precio") === "0" ? "" : formatMXN(product.sale_price)}
          photo={{ src: `data:image/jpeg;base64,${data.toString("base64")}`, width: info.width, height: info.height }}
        />
      ),
      { ...size, fonts: await loadFonts() },
    ).arrayBuffer();

    const jpg = await sharp(Buffer.from(png)).jpeg({ quality: 90, mozjpeg: true }).toBuffer();
    return new Response(new Uint8Array(jpg), {
      headers: { "Content-Type": "image/jpeg", "Cache-Control": "public, max-age=3600, s-maxage=86400" },
    });
  } catch (err) {
    console.error("[redes] No se pudo generar la pieza:", err instanceof Error ? err.message : err);
    return new Response("No se pudo generar la imagen", { status: 500 });
  }
}
