import { ImageResponse } from "next/og";
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";

// Un logotipo distinto en cada generación: la imagen no se pre-renderiza en el build.
export const dynamic = "force-dynamic";

export const alt = "Cervezaverso | Tienda de Cervezas del Mundo";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpengraphImage() {
  const logosDir = join(process.cwd(), "public/img/cervezaverso-logos-v2/logos/circular");
  const logos = (await readdir(logosDir)).filter((name) => name.toLowerCase().endsWith(".png"));
  const logo = await readFile(join(logosDir, logos[Math.floor(Math.random() * logos.length)]));

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: "#f2f4f5",
          padding: 48,
        }}
      >
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "#000",
            borderRadius: 28,
            padding: "0 72px",
            color: "#fff",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", maxWidth: 560 }}>
            <div style={{ fontSize: 32, opacity: 0.6, letterSpacing: "-0.02em" }}>Cervezaverso</div>
            <div style={{ fontSize: 72, fontWeight: 600, lineHeight: 1.02, letterSpacing: "-0.045em", marginTop: 16 }}>
              Cerveza artesanal, nacional e importada.
            </div>
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`data:image/png;base64,${logo.toString("base64")}`}
            alt=""
            width={440}
            height={440}
            style={{ objectFit: "contain" }}
          />
        </div>
      </div>
    ),
    size
  );
}
