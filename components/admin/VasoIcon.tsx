import type { VasoCode } from "@/lib/vasos";

/** Silueta de cada vaso en un lienzo de 24×32, trazada con `currentColor`. */
const SHAPES: Record<VasoCode, string> = {
  sin_servida: "M5 13h14v15H5z M5 13l2.5-4h9l2.5 4 M12 9v4 M9 18h6",
  highball: "M7.5 3h9v24.5a1.5 1.5 0 0 1-1.5 1.5H9a1.5 1.5 0 0 1-1.5-1.5z M10 12h3v3h-3z M11.5 18h3v3h-3z",
  copa_vino: "M7 4h10c.4 6.5-1.8 11-5 11s-5.4-4.5-5-11z M12 15v11 M8 28h8",
  flauta_champana: "M9.5 3h5c.3 9-.7 14-2.5 14s-2.8-5-2.5-14z M12 17v9 M8.5 28h7",
  teku: "M7 3h10l-1.6 3.5L17 10l-5 5.5L7 10l1.6-3.5z M12 15.5v10.5 M8.5 28h7",
  weizen: "M9.5 29h5c0-5 .6-8.5 1.4-12.5S18 7.5 17.3 3H6.7c-.7 4.5.6 9.5 1.4 13.5S9.5 24 9.5 29z",
  vaso_hexagonal_wit: "M6 10h12l-1 18H7z M10 10l.4 18 M14 10l-.4 18",
  flauta_lambic: "M9 3h6l-.5 22h-5z M9.5 25h5v4h-5z",
  caliz: "M4.5 5h15c0 6.5-3.3 10-7.5 10S4.5 11.5 4.5 5z M10.8 15v10 M13.2 15v10 M7.5 28h9 M10 25.5h4",
  tulipa:
    "M8.2 3h7.6c-.2 1.8-1 2.8-1 4 0 1.2 3.4 3 3.4 7.2 0 3.2-2.8 5.3-6.2 5.3s-6.2-2.1-6.2-5.3c0-4.2 3.4-6 3.4-7.2 0-1.2-.8-2.2-1-4z M12 19.5v6.5 M8.5 28h7",
  snifter: "M9 7h6c3 1.8 5 4.6 5 8a8 8 0 0 1-16 0c0-3.4 2-6.2 5-8z M12 23v3 M8.5 28h7",
  copa_cardo:
    "M6.8 3h10.4c0 4-2.2 7-2.2 9.3 2 1 3 2.8 3 4.7a6 6 0 0 1-12 0c0-1.9 1-3.7 3-4.7 0-2.3-2.2-5.3-2.2-9.3z M12 23v3 M8.5 28h7",
  pinta_tulipa_irlandesa: "M8 3c-1.2 3-1.2 6 .2 8.5L9.2 29h5.6l1-17.5c1.4-2.5 1.4-5.5.2-8.5z",
  tulipa_chica: "M8.6 7h6.8c1.2 3 1.6 5.8 1.1 8-.5 2-2 3.3-4.5 3.3s-4-1.3-4.5-3.3c-.5-2.2-.1-5 1.1-8z M12 18.3v7.2 M8.5 28h7",
  copa_pilsner: "M7 3h10l-3.4 21h-3.2z M12 24v3 M9 28h6",
  tarro_checo: "M5 7h11v21H5z M16 11h2.5a1.5 1.5 0 0 1 1.5 1.5v8a1.5 1.5 0 0 1-1.5 1.5H16 M8 10v15 M10.5 10v15 M13 10v15",
  tarro_aleman: "M4.5 8h11.5v20H4.5z M16 12h2.5a1.5 1.5 0 0 1 1.5 1.5v8a1.5 1.5 0 0 1-1.5 1.5H16",
  becher_cilindrico: "M8 11h8v17.5H8z",
  copa_ipa: "M8.3 3h7.4c1.1 5 .9 9.2-1.6 12.5H9.9C7.4 12.2 7.2 8 8.3 3z M10 15.5h4l.5 13.5h-5z M10.2 19.5h3.6 M10.3 23h3.4",
  pinta_americana: "M6 3h12l-1.6 25.5H7.6z",
  pinta_nonic: "M6.5 3h11l-.3 2.8c.9.6.9 2.2 0 2.8L16.1 29H7.9L6.8 8.6c-.9-.6-.9-2.2 0-2.8z",
  willi_becher: "M8.3 3h7.4l1.3 6.5L15 29H9L7 9.5z",
};

/** Hoyuelos del tarro alemán (círculos que no caben en un solo trazo de línea). */
const DIMPLES = [
  [7.5, 12], [10.25, 12], [13, 12],
  [7.5, 16.5], [10.25, 16.5], [13, 16.5],
  [7.5, 21], [10.25, 21], [13, 21],
] as const;

type Props = { code: VasoCode | null; className?: string };

/** Dibujo simple del vaso (decorativo: el nombre siempre va junto como texto). */
export default function VasoIcon({ code, className = "h-8 w-6" }: Props) {
  return (
    <svg
      viewBox="0 0 24 32"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className={className}
    >
      {code ? (
        <>
          <path d={SHAPES[code]} />
          {code === "tarro_aleman" &&
            DIMPLES.map(([cx, cy]) => <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={0.6} />)}
        </>
      ) : (
        // Sin asignar: silueta punteada de una pinta.
        <path d="M6 3h12l-1.6 25.5H7.6z" strokeDasharray="2 2.2" />
      )}
    </svg>
  );
}
