import type { ReactElement } from "react";

/**
 * Pieza de redes con la foto real de la cerveza, dibujada con JSX para `ImageResponse` (Satori).
 * Reglas de la campaña: mucha imagen y poco texto, fondos y acomodos que rotan, sin personas,
 * sin imperativos de consumo y con la leyenda sanitaria siempre visible.
 */

export const LEYENDA = "El abuso en el consumo de este producto es nocivo para la salud. +18";

export type PiezaFormato = "feed" | "historia";
export type PiezaLayout = "a" | "b" | "c" | "d";

export type PiezaPaleta = { bg: string; bg2: string; text: string; accent: string; onAccent: string };

export const PIEZA_PALETAS: Record<string, PiezaPaleta> = {
  violeta: { bg: "#5433eb", bg2: "#2f17a8", text: "#ffffff", accent: "#ffd23f", onAccent: "#1b1b1b" },
  crema: { bg: "#f4ead8", bg2: "#e6d3ae", text: "#1b1b1b", accent: "#5433eb", onAccent: "#ffffff" },
  carbon: { bg: "#1a1a1a", bg2: "#000000", text: "#ffffff", accent: "#ffb703", onAccent: "#1b1b1b" },
  ambar: { bg: "#f8b01b", bg2: "#e2680f", text: "#1b1b1b", accent: "#ffffff", onAccent: "#1b1b1b" },
  lupulo: { bg: "#2d6a4f", bg2: "#143528", text: "#ffffff", accent: "#ffd23f", onAccent: "#1b1b1b" },
  vino: { bg: "#8a1c3c", bg2: "#4a0d1f", text: "#ffffff", accent: "#ffd9a0", onAccent: "#1b1b1b" },
  azul: { bg: "#0f4c75", bg2: "#08263b", text: "#ffffff", accent: "#7ae7ff", onAccent: "#1b1b1b" },
};

export const PIEZA_SIZE: Record<PiezaFormato, { width: number; height: number }> = {
  feed: { width: 1080, height: 1350 },
  historia: { width: 1080, height: 1920 },
};

export type PiezaProps = {
  formato: PiezaFormato;
  layout: PiezaLayout;
  paleta: PiezaPaleta;
  kicker: string;
  big: string;
  name: string;
  /** «Stout · Irlanda». */
  detail: string;
  /** Precio ya formateado; vacío = no se muestra. */
  price: string;
  photo: { src: string; width: number; height: number };
};

/** Tamaño de letra del titular según su largo, para que nunca pase de 3 o 4 líneas. */
function bigSize(text: string, base: number) {
  const n = text.length;
  if (n <= 18) return base;
  if (n <= 30) return Math.round(base * 0.8);
  if (n <= 45) return Math.round(base * 0.66);
  return Math.round(base * 0.56);
}

function fit(photo: PiezaProps["photo"], maxW: number, maxH: number) {
  const s = Math.min(maxW / photo.width, maxH / photo.height);
  return { width: Math.round(photo.width * s), height: Math.round(photo.height * s) };
}

function Photo({ photo, maxW, maxH }: { photo: PiezaProps["photo"]; maxW: number; maxH: number }) {
  const size = fit(photo, maxW, maxH);
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={photo.src} alt="" width={size.width} height={size.height} />;
}

function Footer({ color, story }: { color: string; story: boolean }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", width: "100%", color, marginBottom: story ? 170 : 0 }}>
      <div style={{ display: "flex", width: 560, fontSize: 21, fontWeight: 500, lineHeight: 1.25, opacity: 0.8 }}>{LEYENDA}</div>
      <div style={{ display: "flex", fontSize: 30, fontWeight: 800 }}>cervezaverso.com</div>
    </div>
  );
}

function Price({ price, bg, color, size = 44 }: { price: string; bg: string; color: string; size?: number }) {
  if (!price) return null;
  return (
    <div style={{ display: "flex", backgroundColor: bg, color, fontSize: size, fontWeight: 900, padding: "10px 30px", borderRadius: 9999 }}>{price}</div>
  );
}

function Headline({ kicker, big, color, accent, base, width }: { kicker: string; big: string; color: string; accent: string; base: number; width: number }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", width }}>
      <div style={{ display: "flex", fontSize: 30, fontWeight: 800, letterSpacing: 3, textTransform: "uppercase", color: accent }}>{kicker}</div>
      <div style={{ display: "flex", marginTop: 14, fontSize: bigSize(big, base), fontWeight: 900, lineHeight: 1.03, letterSpacing: -2, color }}>{big}</div>
    </div>
  );
}

export function Pieza(p: PiezaProps): ReactElement {
  const { width: W, height: H } = PIEZA_SIZE[p.formato];
  const story = p.formato === "historia";
  const c = p.paleta;
  const gradient = `linear-gradient(160deg, ${c.bg} 0%, ${c.bg2} 100%)`;
  const padTop = story ? 250 : 72;
  const base = { display: "flex", flexDirection: "column", width: W, height: H, fontFamily: "Inter" } as const;

  if (p.layout === "a") {
    // Tarjeta blanca grande sobre el color.
    return (
      <div style={{ ...base, backgroundImage: gradient, padding: `${padTop}px 72px 56px` }}>
        <Headline kicker={p.kicker} big={p.big} color={c.text} accent={c.accent} base={104} width={W - 144} />
        <div style={{ display: "flex", flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#ffffff", borderRadius: 48, margin: "44px 0 36px", boxShadow: "0 30px 60px rgba(0,0,0,0.30)" }}>
          <Photo photo={p.photo} maxW={W - 144 - 120} maxH={story ? 800 : 560} />
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 34 }}>
          <div style={{ display: "flex", width: p.price ? 640 : W - 144, fontSize: 46, fontWeight: 800, lineHeight: 1.08, color: c.text }}>{p.name}</div>
          <Price price={p.price} bg={c.accent} color={c.onAccent} />
        </div>
        <Footer color={c.text} story={story} />
      </div>
    );
  }

  if (p.layout === "b") {
    // Círculo blanco gigante que se sale por la derecha.
    const d = story ? 960 : 800;
    return (
      <div style={{ ...base, backgroundImage: gradient, padding: `${padTop}px 72px 56px`, position: "relative" }}>
        <div style={{ display: "flex", position: "absolute", right: -150, top: story ? 500 : 290, width: d, height: d, borderRadius: d, backgroundColor: "#ffffff", alignItems: "center", justifyContent: "center", boxShadow: "0 30px 70px rgba(0,0,0,0.28)" }}>
          <div style={{ display: "flex", marginRight: 90 }}>
            <Photo photo={p.photo} maxW={d * 0.56} maxH={d * 0.7} />
          </div>
        </div>
        <Headline kicker={p.kicker} big={p.big} color={c.text} accent={c.accent} base={96} width={W - 144} />
        <div style={{ display: "flex", flex: 1 }} />
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", marginBottom: 34 }}>
          <Price price={p.price} bg={c.accent} color={c.onAccent} />
          <div style={{ display: "flex", width: 430, marginTop: 16, fontSize: 40, fontWeight: 800, lineHeight: 1.08, color: c.text }}>{p.name}</div>
        </div>
        <Footer color={c.text} story={story} />
      </div>
    );
  }

  if (p.layout === "c") {
    // Mitad color con el mensaje, mitad blanca con foto a la izquierda y datos a la derecha.
    const top = story ? 760 : 470;
    return (
      <div style={{ ...base, backgroundColor: "#ffffff" }}>
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "flex-end", height: top, backgroundImage: gradient, padding: `${padTop}px 72px 52px` }}>
          <Headline kicker={p.kicker} big={p.big} color={c.text} accent={c.accent} base={100} width={W - 144} />
        </div>
        <div style={{ display: "flex", flex: 1, alignItems: "center", padding: "0 72px" }}>
          <div style={{ display: "flex", width: 470, justifyContent: "center" }}>
            <Photo photo={p.photo} maxW={450} maxH={story ? 760 : 640} />
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", width: 430, marginLeft: 36 }}>
            <div style={{ display: "flex", fontSize: 26, fontWeight: 800, letterSpacing: 2, textTransform: "uppercase", color: "#666361" }}>{p.detail}</div>
            <div style={{ display: "flex", margin: "14px 0 26px", fontSize: 58, fontWeight: 900, lineHeight: 1.04, letterSpacing: -1, color: "#111111" }}>{p.name}</div>
            <Price price={p.price} bg={c.bg} color={c.text} size={48} />
          </div>
        </div>
        <div style={{ display: "flex", padding: "0 72px 56px" }}>
          <Footer color="#111111" story={story} />
        </div>
      </div>
    );
  }

  // d · Editorial: marco de color, panel blanco, foto protagonista y titular abajo.
  return (
    <div style={{ ...base, backgroundImage: gradient, padding: story ? "230px 40px 190px" : "40px" }}>
      <div style={{ display: "flex", flexDirection: "column", flex: 1, backgroundColor: "#ffffff", borderRadius: 48, padding: "48px 52px 44px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", fontSize: 28, fontWeight: 800, letterSpacing: 3, textTransform: "uppercase", color: "#666361" }}>{p.kicker}</div>
          <Price price={p.price} bg={c.bg} color={c.text} size={40} />
        </div>
        <div style={{ display: "flex", flex: 1, alignItems: "center", justifyContent: "center" }}>
          <Photo photo={p.photo} maxW={820} maxH={story ? 820 : 610} />
        </div>
        <div style={{ display: "flex", fontSize: bigSize(p.big, 92), fontWeight: 900, lineHeight: 1.03, letterSpacing: -2, color: "#111111" }}>{p.big}</div>
        <div style={{ display: "flex", margin: "16px 0 30px", fontSize: 36, fontWeight: 800, color: c.bg === "#f4ead8" || c.bg === "#f8b01b" ? "#111111" : c.bg }}>{p.name}</div>
        <Footer color="#111111" story={false} />
      </div>
    </div>
  );
}
