"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import type { Product } from "@/lib/types";
import { formatMXN } from "@/lib/pricing";
import { useCart } from "@/lib/cart-context";
import ProductImage from "./ProductImage";

/** Tarjeta compacta para el chat de Graciela: miniatura, nombre, estilo y precio. */
export default function MiniProductCard({ product, onSelect }: { product: Product; onSelect: () => void }) {
  const { addItem } = useCart();
  const isOutOfStock = product.stock_status === "out_of_stock";

  return (
    <div className="flex h-full items-center gap-3 rounded-[20px] bg-white p-3 shadow-card">
      <Link
        href={`/cervezas/${product.sku}`}
        onClick={onSelect}
        className="flex min-w-0 flex-1 items-center gap-3"
      >
        <span className="group relative block h-20 w-16 shrink-0 overflow-hidden rounded-[14px] bg-white">
          <ProductImage src={product.image_url} alt={product.name} sizes="64px" />
        </span>
        <span className="min-w-0">
          <span className="block line-clamp-2 text-sm font-semibold leading-snug tracking-[-0.02em]">
            {product.name}
          </span>
          <span className="block truncate text-xs text-muted">{product.style}</span>
          <span className="mt-1 block text-sm font-semibold">{formatMXN(product.sale_price)}</span>
        </span>
      </Link>
      <button
        type="button"
        disabled={isOutOfStock}
        onClick={() => {
          addItem(product);
          onSelect();
        }}
        aria-label={`Agregar ${product.name} al carrito`}
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-pill bg-accent text-white transition-transform active:scale-95 disabled:cursor-not-allowed disabled:bg-black/10 disabled:text-muted"
      >
        <Plus size={18} strokeWidth={2.5} aria-hidden />
      </button>
    </div>
  );
}
