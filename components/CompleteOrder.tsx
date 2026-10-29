"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { obtenerSugerenciasPedido } from "@/app/actions/sugerencias";
import { trackAddToCart } from "@/lib/analytics";
import { useCart } from "@/lib/cart-context";
import { formatMXN } from "@/lib/pricing";
import { normalCase } from "@/lib/text-case";
import type { Product } from "@/lib/types";
import ProductImage from "./ProductImage";

/** «Completa tu pedido» en el cajón: 3 cervezas con foto, del estilo de lo que ya hay en el carrito o destacadas. */
export default function CompleteOrder() {
  const { items, addItem, closeDrawer } = useCart();
  const [suggestions, setSuggestions] = useState<Product[]>([]);

  // Misma clave = misma consulta: cambiar cantidades no vuelve a pedir sugerencias.
  const ids = items.map((item) => item.product.id).sort();
  const styles = [...new Set(items.map((item) => item.product.style))].sort();
  const key = JSON.stringify([ids, styles]);

  useEffect(() => {
    let cancelled = false;
    const [excludeIds, wantedStyles] = JSON.parse(key) as [string[], string[]];
    obtenerSugerenciasPedido({ styles: wantedStyles, excludeIds })
      .then((products) => {
        if (!cancelled) setSuggestions(products);
      })
      .catch(() => {
        if (!cancelled) setSuggestions([]);
      });
    return () => {
      cancelled = true;
    };
  }, [key]);

  if (suggestions.length === 0) return null;

  return (
    <section aria-labelledby="complete-order-title" className="space-y-2 pt-2">
      <h3 id="complete-order-title" className="px-1 text-sm font-semibold tracking-tight">
        Completa tu pedido
      </h3>
      <ul className="space-y-2">
        {suggestions.map((product) => (
          <li key={product.id} className="flex items-center gap-3 rounded-[20px] bg-white p-3 shadow-card">
            <Link
              href={`/cervezas/${product.sku}`}
              onClick={closeDrawer}
              className="flex min-w-0 flex-1 items-center gap-3"
            >
              <span className="group relative block h-20 w-16 shrink-0 overflow-hidden rounded-[14px] bg-white">
                <ProductImage src={product.image_url} alt={normalCase(product.name)} sizes="64px" thumb />
              </span>
              <span className="min-w-0">
                <span className="line-clamp-2 block text-sm font-semibold leading-snug tracking-[-0.02em]">
                  {normalCase(product.name)}
                </span>
                <span className="block truncate text-xs text-muted">{normalCase(product.style)}</span>
                <span className="mt-0.5 block text-sm font-semibold">{formatMXN(product.sale_price)}</span>
              </span>
            </Link>
            <button
              type="button"
              onClick={() => {
                addItem(product, 1, { openDrawer: false });
                trackAddToCart(product);
              }}
              aria-label={`Agregar ${normalCase(product.name)} al carrito`}
              className="flex min-h-11 shrink-0 items-center gap-1 rounded-full bg-accent px-4 text-sm font-semibold text-white transition-transform active:scale-95"
            >
              <Plus size={16} strokeWidth={2.5} aria-hidden />
              Agregar
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
