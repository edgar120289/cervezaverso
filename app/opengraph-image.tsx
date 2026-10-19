import { ImageResponse } from "next/og";
import { OG_LOGO_SRC } from "./og-logo";

export const alt = "Cervezaverso | Tienda de Cervezas del Mundo";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          width: "100%",
          height: "100%",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#FFFFFF",
          padding: "0 72px",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", width: 600, color: "#000000" }}>
          <div style={{ display: "flex", fontSize: 32, color: "#666361" }}>Cervezaverso</div>
          <div style={{ display: "flex", fontSize: 68, fontWeight: 700, lineHeight: 1.05, marginTop: 16 }}>
            Cerveza artesanal, nacional e importada
          </div>
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={OG_LOGO_SRC} alt="" width={400} height={400} style={{ marginLeft: 48 }} />
      </div>
    ),
    size,
  );
}
