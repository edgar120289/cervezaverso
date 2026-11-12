"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, Search, Wand2 } from "lucide-react";
import { buscarCervezasParaRedes, type ProductoRedes } from "@/app/actions/admin-redes";
import { formatMXN } from "@/lib/pricing";
import { normalCase } from "@/lib/text-case";
import { cargarFoto, LAYOUTS, PALETTES, renderPost, type PostFormat, type PostLayout } from "@/lib/post-render";

const field = "min-h-11 w-full rounded-2xl bg-canvas px-4 text-sm outline-none focus:ring-2 focus:ring-black/15";

/**
 * Arma una pieza con la foto real de la cerveza (plantillas A/B/C del plan de campaña) y la entrega como JPG.
 * No inventa datos: nombre y precio salen del catálogo.
 */
export default function PostGenerator({
  formato,
  onUse,
}: {
  formato: PostFormat;
  onUse: (blob: Blob) => Promise<void>;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ProductoRedes[]>([]);
  const [producto, setProducto] = useState<ProductoRedes | null>(null);
  const [photo, setPhoto] = useState<ImageBitmap | null>(null);
  const [layout, setLayout] = useState<PostLayout>("tarjeta");
  const [paletteId, setPaletteId] = useState(PALETTES[0].id);
  const [kicker, setKicker] = useState("La encuentras en");
  const [conPrecio, setConPrecio] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Búsqueda con espera de 300 ms.
  useEffect(() => {
    const term = query.trim();
    if (term.length < 2) return;
    const t = setTimeout(() => {
      buscarCervezasParaRedes(term).then(setResults).catch(() => setResults([]));
    }, 300);
    return () => clearTimeout(t);
  }, [query]);

  const visibles = query.trim().length >= 2 ? results : [];

  async function elegir(p: ProductoRedes) {
    setProducto(p);
    setResults([]);
    setQuery("");
    setError(null);
    setBusy(true);
    try {
      setPhoto(await cargarFoto(p.image_url));
    } catch (err) {
      setPhoto(null);
      setError(err instanceof Error ? err.message : "No se pudo cargar la foto.");
    } finally {
      setBusy(false);
    }
  }

  // Vista previa: se redibuja con cada cambio.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !producto || !photo) return;
    try {
      renderPost(canvas, {
        format: formato,
        layout,
        palette: PALETTES.find((p) => p.id === paletteId) ?? PALETTES[0],
        kicker,
        name: normalCase(producto.name),
        price: conPrecio ? formatMXN(producto.sale_price) : "",
        photo,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "No se pudo dibujar la imagen.";
      setTimeout(() => setError(message), 0);
    }
  }, [producto, photo, layout, paletteId, kicker, conPrecio, formato]);

  async function usar() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    setBusy(true);
    setError(null);
    try {
      const blob = await new Promise<Blob>((resolve, reject) =>
        canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("No se pudo convertir la imagen."))), "image/jpeg", 0.92),
      );
      await onUse(blob);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo agregar la imagen.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4 rounded-2xl bg-canvas p-4">
      <p className="flex items-center gap-2 text-sm font-semibold">
        <Wand2 size={16} aria-hidden /> Crear con foto real
      </p>
      <div className="relative">
        <Search size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted" aria-hidden />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar cerveza por nombre o SKU"
          className={`${field} bg-white pl-10`}
          aria-label="Buscar cerveza"
        />
        {visibles.length > 0 && (
          <ul className="absolute z-10 mt-1 w-full overflow-hidden rounded-2xl bg-white shadow-card ring-1 ring-black/10">
            {visibles.map((r) => (
              <li key={r.sku}>
                <button type="button" onClick={() => elegir(r)} className="flex w-full items-center gap-3 px-4 py-2 text-left text-sm hover:bg-canvas">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={r.image_url} alt="" className="size-9 rounded-lg bg-white object-contain" />
                  <span className="min-w-0 flex-1 truncate font-semibold">{normalCase(r.name)}</span>
                  <span className="text-muted">{formatMXN(r.sale_price)}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {producto && (
        <div className="grid gap-4 md:grid-cols-[minmax(0,260px)_1fr]">
          <canvas ref={canvasRef} className="h-auto w-full rounded-2xl bg-white ring-1 ring-black/10" aria-label="Vista previa de la pieza" />
          <div className="space-y-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">Acomodo</p>
              <div className="mt-1 flex flex-wrap gap-2">
                {LAYOUTS.map((l) => (
                  <button
                    key={l.id}
                    type="button"
                    onClick={() => setLayout(l.id)}
                    className={`min-h-11 rounded-full px-4 text-sm font-semibold ${layout === l.id ? "bg-black text-white" : "bg-white"}`}
                  >
                    {l.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">Fondo</p>
              <div className="mt-1 flex flex-wrap gap-2">
                {PALETTES.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setPaletteId(p.id)}
                    aria-label={p.label}
                    aria-pressed={paletteId === p.id}
                    className={`size-11 rounded-full ring-2 ${paletteId === p.id ? "ring-black" : "ring-transparent"}`}
                    style={{ background: `linear-gradient(135deg, ${p.bg}, ${p.bg2})` }}
                  />
                ))}
              </div>
            </div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-muted">
              Frase corta
              <input value={kicker} onChange={(e) => setKicker(e.target.value)} maxLength={40} spellCheck lang="es" className={`${field} mt-1 bg-white font-normal normal-case tracking-normal`} />
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={conPrecio} onChange={(e) => setConPrecio(e.target.checked)} /> Mostrar precio
            </label>
            <button
              type="button"
              onClick={usar}
              disabled={busy || !photo}
              className="flex min-h-11 items-center gap-2 rounded-full bg-accent px-4 text-sm font-semibold text-white disabled:opacity-50"
            >
              {busy && <Loader2 size={16} className="animate-spin" />} Usar esta imagen
            </button>
          </div>
        </div>
      )}
      {error && <p className="text-sm text-danger">{error}</p>}
    </div>
  );
}
