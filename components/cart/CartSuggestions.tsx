"use client";

import { startTransition, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { obtenerSugerenciasPedido } from "@/app/actions/sugerencias";
import { trackAddToCart } from "@/lib/analytics";
import { useCart } from "@/lib/cart-context";
import { formatMXN } from "@/lib/pricing";
import { normalCase } from "@/lib/text-case";
import type { Product } from "@/lib/types";
import ProductImage from "@/components/ProductImage";

/**
 * «Agrega una más»: hasta 4 cervezas en existencia y con foto, del estilo de lo que ya hay o destacadas.
 * Solo en el carrito (página y cajón), nunca en el checkout. El espacio se reserva desde el inicio
 * para que la lista no empuje el contenido al llegar.
 */
export default function CartSuggestions({ onNavigate }: { onNavigate?: () => void }) {
  const { items, addItem } = useCart();
  const [suggestions, setSuggestions] = useState<Product[] | null>(null);
  const sectionRef = useRef<HTMLElement>(null);
  // Se piden cuando la sección está por verse: abrir el carrito no compite con lo que ya está en pantalla.
  const [nearView, setNearView] = useState(false);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el || nearView) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) setNearView(true);
      },
      { rootMargin: "400px 0px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [nearView]);

  // Misma clave = misma consulta: cambiar cantidades no vuelve a pedir sugerencias.
  const ids = items.map((item) => item.product.id).sort();
  const styles = [...new Set(items.map((item) => item.product.style))].sort();
  const key = JSON.stringify([ids, styles]);

  useEffect(() => {
    if (!nearView) return;
    let cancelled = false;
    const [excludeIds, wantedStyles] = JSON.parse(key) as [string[], string[]];
    obtenerSugerenciasPedido({ styles: wantedStyles, excludeIds })
      .then((products) => {
        if (!cancelled) startTransition(() => setSuggestions(products));
      })
      .catch(() => {
        if (!cancelled) setSuggestions([]);
      });
    return () => {
      cancelled = true;
    };
  }, [key, nearView]);

  if (suggestions !== null && suggestions.length === 0) return null;

  return (
    <section ref={sectionRef} aria-labelledby="cart-suggestions-title" className="space-y-2">
      <h2 id="cart-suggestions-title" className="px-1 text-base font-semibold tracking-tight">
        Agrega una más
      </h2>
      <ul className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {(suggestions ?? Array.from({ length: 4 }, () => null)).map((product, index) =>
          product ? (
            <li key={product.id} className="flex flex-col rounded-[20px] bg-white p-2.5 shadow-card">
              <Link href={`/cervezas/${product.sku}`} onClick={onNavigate} className="flex min-w-0 flex-1 flex-col gap-1.5">
                <span className="relative block aspect-square w-full overflow-hidden rounded-[14px] bg-white">
                  <ProductImage src={product.image_url} alt={normalCase(product.name)} sizes="160px" thumb className="object-contain" />
                </span>
                <span className="line-clamp-2 min-h-[2.5rem] text-sm font-semibold leading-5">{normalCase(product.name)}</span>
                <span className="h-5 text-sm font-semibold leading-5 tabular-nums">{formatMXN(product.sale_price)}</span>
              </Link>
              <button
                type="button"
                onClick={() => {
                  addItem(product, 1, { openDrawer: false });
                  trackAddToCart(product);
                }}
                aria-label={`Agregar ${normalCase(product.name)} al carrito`}
                className="mt-2 flex min-h-11 w-full items-center justify-center gap-1 rounded-full border border-accent text-sm font-semibold text-accent transition-colors hover:bg-accent hover:text-white active:scale-95"
              >
                <Plus size={16} strokeWidth={2.5} aria-hidden />
                Agregar
              </button>
            </li>
          ) : (
            // Misma estructura que la tarjeta real, para que no se mueva nada al llegar las sugerencias.
            <li key={index} aria-hidden className="flex flex-col rounded-[20px] bg-white p-2.5 shadow-card">
              <span className="flex flex-1 flex-col gap-1.5">
                <span className="block aspect-square w-full animate-pulse rounded-[14px] bg-canvas" />
                <span className="min-h-[2.5rem]" />
                <span className="h-5" />
              </span>
              <span className="mt-2 block min-h-11 rounded-full bg-canvas" />
            </li>
          )
        )}
      </ul>
    </section>
  );
}
