"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { Minus, Pencil, Plus, Search, Trash2, X } from "lucide-react";
import { buscarProductosParaPedido, editarPedido, type ProductoParaPedido } from "@/app/actions/admin-pedido-edicion";
import { formatMXN } from "@/lib/pricing";
import { normalCase } from "@/lib/text-case";

export type RenglonInicial = {
  id: string;
  sku: string;
  nombre: string;
  precio_unitario: number;
  cantidad: number;
  importe: number;
  agregado: boolean;
};

type Renglon = {
  key: string;
  id?: string;
  productId?: string;
  sku: string;
  nombre: string;
  precio: string;
  cantidad: number;
  nuevo: boolean;
  agregado: boolean;
};

type Props = {
  pedidoId: string;
  items: RenglonInicial[];
  subtotal: number;
  descuento: number;
  promoCode: string | null;
  descuentoVolumen: number;
  costoEnvio: number;
  total: number;
  notas: string;
  /** Motivo por el que no se puede editar (cancelado, o pendiente de Mercado Pago). */
  bloqueo: string | null;
};

const iconBtn =
  "inline-flex size-11 shrink-0 items-center justify-center rounded-full bg-canvas text-black transition-colors hover:bg-black/10 disabled:opacity-40";
const input = "min-h-11 rounded-2xl bg-canvas px-3 text-sm outline-none focus:ring-2 focus:ring-black/15";

function aRenglones(items: RenglonInicial[]): Renglon[] {
  return items.map((i) => ({
    key: i.id,
    id: i.id,
    sku: i.sku,
    nombre: i.nombre,
    precio: String(Number(i.precio_unitario)),
    cantidad: i.cantidad,
    nuevo: false,
    agregado: i.agregado,
  }));
}

function Totales({ subtotal, descuento, promoCode, descuentoVolumen, envio, total }: { subtotal: number; descuento: number; promoCode: string | null; descuentoVolumen: number; envio: React.ReactNode; total: number }) {
  return (
    <div className="mt-2 space-y-2 border-t border-black/5 pt-4 text-sm">
      <div className="flex justify-between text-black/60">
        <span>Subtotal</span>
        <span className="tabular-nums">{formatMXN(subtotal)}</span>
      </div>
      {descuento > 0 && (
        <div className="flex justify-between font-semibold text-accent">
          <span>Descuento{promoCode ? ` (${promoCode})` : ""}</span>
          <span className="tabular-nums">−{formatMXN(descuento)}</span>
        </div>
      )}
      {descuentoVolumen > 0 && (
        <div className="flex justify-between font-semibold text-accent">
          <span>Descuento por volumen (10%)</span>
          <span className="tabular-nums">−{formatMXN(descuentoVolumen)}</span>
        </div>
      )}
      <div className="flex items-center justify-between gap-3 text-black/60">
        <span>Envío</span>
        {envio}
      </div>
      <div className="flex justify-between pt-2 text-base font-semibold">
        <span>Total</span>
        <span className="tabular-nums">{formatMXN(total)}</span>
      </div>
    </div>
  );
}

/** Productos del pedido: vista normal y modo edición (agregar, quitar, cantidad, precio, envío y notas del cliente). */
export default function PedidoEditor(props: Props) {
  const [editando, setEditando] = useState(false);
  const [renglones, setRenglones] = useState<Renglon[]>(() => aRenglones(props.items));
  const [envio, setEnvio] = useState(String(props.costoEnvio));
  const [notas, setNotas] = useState(props.notas);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, startTransition] = useTransition();

  const subtotal = useMemo(
    () => renglones.reduce((s, r) => s + Math.round((Number(r.precio) || 0) * 100) * r.cantidad, 0) / 100,
    [renglones],
  );
  const envioNum = Number(envio) || 0;
  const total = Math.max(subtotal - props.descuento - props.descuentoVolumen + envioNum, 0);

  function reiniciar() {
    setRenglones(aRenglones(props.items));
    setEnvio(String(props.costoEnvio));
    setNotas(props.notas);
    setEditando(false);
  }

  const update = (key: string, patch: Partial<Renglon>) => setRenglones((rs) => rs.map((r) => (r.key === key ? { ...r, ...patch } : r)));

  function agregar(p: ProductoParaPedido) {
    setRenglones((rs) => {
      const existente = rs.find((r) => r.nuevo && r.productId === p.id);
      if (existente) return rs.map((r) => (r === existente ? { ...r, cantidad: Math.min(r.cantidad + 1, 99) } : r));
      return [...rs, { key: `n-${p.id}`, productId: p.id, sku: p.sku, nombre: p.name, precio: String(p.sale_price), cantidad: 1, nuevo: true, agregado: true }];
    });
  }

  function guardar() {
    setMsg(null);
    startTransition(async () => {
      const r = await editarPedido({
        pedidoId: props.pedidoId,
        items: renglones.map((r) => ({ id: r.id, productId: r.productId, cantidad: r.cantidad, precioUnitario: Number(r.precio) })),
        costoEnvio: envioNum,
        notas,
      });
      if (r.ok) {
        setEditando(false);
        setMsg({ ok: true, text: r.mensaje ?? "Guardado." });
      } else setMsg({ ok: false, text: r.error });
    });
  }

  // Tras guardar, el servidor manda los renglones nuevos (con id): se toman como base fuera del modo edición.
  const firma = props.items.map((i) => `${i.id}:${i.cantidad}:${i.precio_unitario}`).join("|") + `|${props.costoEnvio}|${props.notas}`;
  const [firmaBase, setFirmaBase] = useState(firma);
  if (firma !== firmaBase && !editando) {
    setFirmaBase(firma);
    setRenglones(aRenglones(props.items));
    setEnvio(String(props.costoEnvio));
    setNotas(props.notas);
  }

  return (
    <section className="rounded-[28px] bg-white p-6 shadow-card">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold tracking-tight">Productos</h2>
        {!editando &&
          (props.bloqueo ? (
            <p className="text-sm text-muted">{props.bloqueo}</p>
          ) : (
            <button
              type="button"
              onClick={() => {
                setMsg(null);
                setEditando(true);
              }}
              className="inline-flex min-h-11 items-center gap-2 rounded-full border border-black/15 px-5 text-sm font-semibold hover:bg-black/[0.04]"
            >
              <Pencil size={16} /> Editar pedido
            </button>
          ))}
      </div>

      {!editando ? (
        <>
          <ul className="divide-y divide-black/5">
            {props.items.map((item) => (
              <li key={item.id} className="flex items-center justify-between gap-4 py-3 text-sm">
                <div className="min-w-0">
                  <p className="font-semibold">
                    {normalCase(item.nombre)}
                    {item.agregado && <span className="ml-2 rounded-full bg-accent/10 px-2 py-0.5 text-xs font-semibold text-accent">Agregado</span>}
                  </p>
                  <p className="text-muted tabular-nums">
                    {item.sku} · {item.cantidad} × {formatMXN(Number(item.precio_unitario))}
                  </p>
                </div>
                <span className="shrink-0 font-semibold tabular-nums">{formatMXN(Number(item.importe))}</span>
              </li>
            ))}
          </ul>
          <Totales
            subtotal={props.subtotal}
            descuento={props.descuento}
            promoCode={props.promoCode}
            descuentoVolumen={props.descuentoVolumen}
            total={props.total}
            envio={<span className="tabular-nums">{props.costoEnvio === 0 ? "Gratis" : formatMXN(props.costoEnvio)}</span>}
          />
        </>
      ) : (
        <>
          <ul className="divide-y divide-black/5">
            {renglones.map((r) => (
              <li key={r.key} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-2 py-3 text-sm sm:grid-cols-[minmax(0,1fr)_auto_auto_auto]">
                <div className="min-w-0">
                  <p className="truncate font-semibold">
                    {normalCase(r.nombre)}
                    {r.agregado && <span className="ml-2 rounded-full bg-accent/10 px-2 py-0.5 text-xs font-semibold text-accent">{r.nuevo ? "Nuevo" : "Agregado"}</span>}
                  </p>
                  <p className="text-muted">{r.sku}</p>
                </div>
                <button type="button" onClick={() => setRenglones((rs) => rs.filter((x) => x.key !== r.key))} className={`${iconBtn} sm:order-last`} aria-label={`Quitar ${normalCase(r.nombre)}`}>
                  <Trash2 size={16} />
                </button>
                <div className="flex items-center gap-1">
                  <button type="button" onClick={() => update(r.key, { cantidad: Math.max(r.cantidad - 1, 1) })} disabled={r.cantidad <= 1} className={iconBtn} aria-label="Una menos">
                    <Minus size={16} />
                  </button>
                  <span className="w-8 text-center font-semibold tabular-nums" aria-live="polite">
                    {r.cantidad}
                  </span>
                  <button type="button" onClick={() => update(r.key, { cantidad: Math.min(r.cantidad + 1, 99) })} disabled={r.cantidad >= 99} className={iconBtn} aria-label="Una más">
                    <Plus size={16} />
                  </button>
                </div>
                <label className="flex items-center gap-2 justify-self-end text-xs font-semibold text-muted">
                  Precio
                  <input
                    inputMode="decimal"
                    value={r.precio}
                    onChange={(e) => update(r.key, { precio: e.target.value.replace(/[^\d.]/g, "") })}
                    className={`${input} w-24 text-right font-semibold text-black tabular-nums`}
                    aria-label={`Precio unitario de ${normalCase(r.nombre)}`}
                  />
                </label>
              </li>
            ))}
          </ul>

          <BuscadorProductos onAgregar={agregar} />

          <Totales
            subtotal={subtotal}
            descuento={props.descuento}
            promoCode={props.promoCode}
            descuentoVolumen={props.descuentoVolumen}
            total={total}
            envio={
              <input
                inputMode="decimal"
                value={envio}
                onChange={(e) => setEnvio(e.target.value.replace(/[^\d.]/g, ""))}
                className={`${input} w-28 text-right font-semibold text-black tabular-nums`}
                aria-label="Costo de envío"
              />
            }
          />

          <label className="mt-4 block text-xs font-semibold uppercase tracking-wide text-muted">
            Notas del cliente (las ve el cliente)
            <textarea value={notas} onChange={(e) => setNotas(e.target.value)} maxLength={1000} rows={3} className="mt-1 w-full rounded-2xl bg-canvas px-4 py-3 text-sm font-normal normal-case text-black outline-none focus:ring-2 focus:ring-black/15" />
          </label>

          {total !== props.total && (
            <p className="mt-3 rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-900">
              El total cambia de {formatMXN(props.total)} a <strong>{formatMXN(total)}</strong>
              {total > props.total ? ` · registra en Pagos el adicional de ${formatMXN(total - props.total)}.` : "."}
            </p>
          )}

          <div className="mt-4 flex flex-wrap gap-3">
            <button type="button" onClick={guardar} disabled={pending || renglones.length === 0} className="inline-flex min-h-11 items-center rounded-full bg-accent px-6 text-sm font-semibold text-white disabled:opacity-60">
              {pending ? "Guardando…" : "Guardar cambios"}
            </button>
            <button type="button" onClick={reiniciar} disabled={pending} className="inline-flex min-h-11 items-center gap-1 rounded-full px-5 text-sm font-semibold text-black/70 hover:bg-black/[0.05]">
              <X size={16} /> Descartar
            </button>
          </div>
        </>
      )}
      {msg && (
        <p role="status" className={`mt-3 text-sm ${msg.ok ? "text-black/70" : "text-danger"}`}>
          {msg.text}
        </p>
      )}
    </section>
  );
}

function BuscadorProductos({ onAgregar }: { onAgregar: (p: ProductoParaPedido) => void }) {
  const [q, setQ] = useState("");
  const [resultados, setResultados] = useState<ProductoParaPedido[]>([]);
  const [buscando, setBuscando] = useState(false);

  useEffect(() => {
    const term = q.trim();
    if (term.length < 2) return;
    let vigente = true;
    const t = setTimeout(async () => {
      setBuscando(true);
      const r = await buscarProductosParaPedido(term);
      if (vigente) {
        setResultados(r);
        setBuscando(false);
      }
    }, 300);
    return () => {
      vigente = false;
      clearTimeout(t);
    };
  }, [q]);

  const visibles = q.trim().length >= 2 ? resultados : [];

  return (
    <div className="mt-4 rounded-[20px] bg-canvas p-3">
      <label className="flex items-center gap-2 rounded-2xl bg-white px-3">
        <Search size={16} className="text-muted" aria-hidden />
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Agregar cerveza: busca por nombre o SKU"
          className="min-h-11 w-full bg-transparent text-sm outline-none"
          aria-label="Buscar cerveza para agregar"
        />
      </label>
      {buscando && q.trim().length >= 2 && <p className="px-2 pt-2 text-xs text-muted">Buscando…</p>}
      {visibles.length > 0 && (
        <ul className="mt-2 max-h-72 space-y-1 overflow-y-auto">
          {visibles.map((p) => (
            <li key={p.id}>
              <button
                type="button"
                onClick={() => {
                  onAgregar(p);
                  setQ("");
                }}
                className="flex min-h-11 w-full items-center justify-between gap-3 rounded-2xl bg-white px-3 py-2 text-left text-sm hover:bg-black/[0.03]"
              >
                <span className="min-w-0">
                  <span className="block truncate font-semibold">{normalCase(p.name)}</span>
                  <span className="block text-xs text-muted">
                    {p.sku} · {p.is_active ? p.stock_status : "Inactiva"}
                  </span>
                </span>
                <span className="flex shrink-0 items-center gap-2 font-semibold tabular-nums">
                  {formatMXN(p.sale_price)} <Plus size={16} className="text-accent" />
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
