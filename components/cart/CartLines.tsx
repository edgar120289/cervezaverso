"use client";

import { Fragment, useEffect, useState } from "react";
import Link from "next/link";
import { Undo2 } from "lucide-react";
import ProductImage from "@/components/ProductImage";
import BottleFallback from "@/components/BottleFallback";
import { UNDO_MS, useCart } from "@/lib/cart-context";
import { formatMXN } from "@/lib/pricing";
import { normalCase } from "@/lib/text-case";
import { MAX_LINE_QUANTITY } from "@/lib/validation";
import type { CartItem } from "@/lib/types";
import QuantityStepper from "./QuantityStepper";

type Variant = "full" | "compact";

/**
 * Renglones del carrito con «Quitar» y «Deshacer». El aviso ocupa el lugar del renglón quitado
 * (no es modal ni flota sobre nada). Pasado el tiempo de deshacer, desaparece con la siguiente
 * interacción del cliente, así el cambio de diseño siempre sigue a una acción suya (sin CLS).
 */
export default function CartLines({ variant, onNavigate }: { variant: Variant; onNavigate?: () => void }) {
  const { items, lastRemoved } = useCart();
  const removedAt = lastRemoved ? Math.min(lastRemoved.index, items.length) : -1;

  return (
    <ul className={variant === "full" ? "space-y-3" : "divide-y divide-black/5"}>
      {items.map((item, index) => (
        <Fragment key={item.product.id}>
          {index === removedAt && <RemovedNotice variant={variant} />}
          <CartLine item={item} variant={variant} onNavigate={onNavigate} />
        </Fragment>
      ))}
      {removedAt === items.length && <RemovedNotice variant={variant} />}
    </ul>
  );
}

function CartLine({ item, variant, onNavigate }: { item: CartItem; variant: Variant; onNavigate?: () => void }) {
  const { setQuantity, removeItem, lineStatus } = useCart();
  const { product, quantity } = item;
  const name = normalCase(product.name);
  const unavailable = lineStatus(product.id) === "unavailable";
  const compact = variant === "compact";
  const thumb = compact ? "h-12 w-12 rounded-[14px]" : "h-20 w-20 rounded-[20px] sm:h-24 sm:w-24";

  return (
    <li className={compact ? "flex gap-3 py-3" : "flex gap-3 rounded-[28px] bg-white p-3 shadow-card sm:gap-4 sm:p-4"}>
      <Link
        href={`/cervezas/${product.sku}`}
        onClick={onNavigate}
        tabIndex={-1}
        aria-hidden
        className={`relative shrink-0 overflow-hidden bg-white ${thumb} ${unavailable ? "opacity-50" : ""}`}
      >
        {product.image_url ? (
          <ProductImage src={product.image_url} alt="" sizes={compact ? "48px" : "96px"} thumb className="object-contain" />
        ) : (
          <span className="flex h-full w-full items-center justify-center text-black/20">
            <BottleFallback className="h-2/3 w-2/3" />
          </span>
        )}
      </Link>

      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <Link
              href={`/cervezas/${product.sku}`}
              onClick={onNavigate}
              className={`line-clamp-2 font-semibold leading-snug hover:underline ${compact ? "text-sm" : ""}`}
            >
              {name}
            </Link>
            {!compact && (
              <p className="truncate text-xs text-muted">
                {normalCase(product.style)} · {normalCase(product.country)}
              </p>
            )}
            {unavailable ? (
              <p className="mt-0.5 text-xs font-semibold text-danger">Se agotó: quítala para continuar.</p>
            ) : (
              quantity >= MAX_LINE_QUANTITY && (
                <p className="mt-0.5 text-xs text-muted">Máximo {MAX_LINE_QUANTITY} piezas por cerveza.</p>
              )
            )}
          </div>
          <span className={`shrink-0 font-semibold tabular-nums ${compact ? "text-sm" : ""}`}>
            {formatMXN(product.sale_price * quantity)}
          </span>
        </div>

        <div className="flex items-center justify-between gap-2">
          <QuantityStepper
            quantity={quantity}
            name={name}
            onChange={(next) => setQuantity(product.id, next)}
            disableIncrease={unavailable}
          />
          <button
            type="button"
            onClick={() => removeItem(product.id)}
            aria-label={`Quitar ${name} del carrito`}
            className="flex min-h-11 items-center rounded-full px-3 text-sm font-semibold text-muted transition-colors hover:bg-black/5 hover:text-black"
          >
            Quitar
          </button>
        </div>
      </div>
    </li>
  );
}

function RemovedNotice({ variant }: { variant: Variant }) {
  const { lastRemoved, undoRemove, dismissRemoved } = useCart();
  const [expired, setExpired] = useState(false);
  const at = lastRemoved?.at ?? 0;

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- nuevo aviso, nuevo plazo
    setExpired(false);
    const timer = window.setTimeout(() => setExpired(true), Math.max(0, at + UNDO_MS - Date.now()));
    return () => window.clearTimeout(timer);
  }, [at]);

  useEffect(() => {
    if (!expired) return;
    const dismiss = () => dismissRemoved();
    document.addEventListener("pointerdown", dismiss, { once: true });
    document.addEventListener("keydown", dismiss, { once: true });
    return () => {
      document.removeEventListener("pointerdown", dismiss);
      document.removeEventListener("keydown", dismiss);
    };
  }, [expired, dismissRemoved]);

  if (!lastRemoved) return null;
  const name = normalCase(lastRemoved.item.product.name);

  return (
    <li
      role="status"
      className={`flex min-h-11 items-center justify-between gap-3 text-sm ${
        variant === "full" ? "rounded-[20px] bg-accent/[0.06] px-4 py-1.5" : "py-1.5"
      }`}
    >
      <span className="min-w-0 truncate text-black/70">
        Quitaste <span className="font-semibold text-black">{name}</span>
      </span>
      {!expired && (
        <button
          type="button"
          onClick={undoRemove}
          className="flex min-h-11 shrink-0 items-center gap-1.5 rounded-full px-3 font-semibold text-accent transition-colors hover:bg-accent/10"
        >
          <Undo2 size={15} aria-hidden />
          Deshacer
        </button>
      )}
    </li>
  );
}
