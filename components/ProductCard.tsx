"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Droplet, GlassWater, Plus } from "lucide-react";
import type { Product } from "@/lib/types";
import { formatMXN } from "@/lib/pricing";
import { useCart } from "@/lib/cart-context";
import CountryFlag from "./CountryFlag";
import ProductImage from "./ProductImage";
import FavoriteButton from "./FavoriteButton";

export default function ProductCard({ product }: { product: Product }) {
  const { addItem } = useCart();
  const isOutOfStock = product.stock_status === "out_of_stock";
  const isLowStock = product.stock_status === "low_stock";

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="group flex h-full flex-col rounded-[28px] bg-white p-4 shadow-card"
    >
      <Link
        href={`/cervezas/${product.sku}`}
        className="relative block aspect-square w-full overflow-hidden rounded-[20px] bg-white"
      >
        <ProductImage
          src={product.image_url}
          alt={product.name}
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
        />

        {product.badges.length > 0 && (
          <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
            {product.badges.slice(0, 2).map((badge) => (
              <span
                key={badge}
                className="rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-semibold text-black/70 backdrop-blur"
              >
                {badge}
              </span>
            ))}
          </div>
        )}

        {isLowStock && (
          <span className="absolute right-3 top-3 flex items-center gap-1.5 rounded-pill border border-accent/20 bg-surface/95 px-2.5 py-1 text-[11px] font-semibold tracking-[-0.01em] text-accent shadow-card backdrop-blur">
            <span aria-hidden className="h-1.5 w-1.5 rounded-pill bg-accent" />
            ¡Últimas piezas!
          </span>
        )}

        {isOutOfStock && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/60 backdrop-blur-sm">
            <span className="rounded-full bg-black px-3 py-1.5 text-xs font-semibold text-white">
              Agotado
            </span>
          </div>
        )}
      </Link>

      <div className="flex flex-1 flex-col gap-2 px-1 pt-4">
        <p className="text-xs text-muted">{product.style}</p>
        <h3 className="line-clamp-2 text-base font-semibold leading-snug tracking-[-0.03em]">
          <Link href={`/cervezas/${product.sku}`} className="hover:text-black/70">
            {product.name}
          </Link>
        </h3>

        <ul className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
          <li className="flex items-center gap-1">
            <Droplet size={13} aria-hidden />
            <span className="sr-only">Alcohol: </span>
            {product.abv}% ABV
          </li>
          <li className="flex items-center gap-1">
            <GlassWater size={13} aria-hidden />
            <span className="sr-only">Volumen: </span>
            {product.volume_ml} ml
          </li>
        </ul>

        <p className="flex items-center gap-1.5 text-sm font-bold text-black">
          <CountryFlag country={product.country} />
          {product.country}
        </p>

        <div className="mt-auto pt-2">
          <span className="text-lg font-semibold">{formatMXN(product.sale_price)}</span>
          <div className="mt-2 flex items-center gap-2">
            <FavoriteButton productId={product.id} productName={product.name} />
            <button
              type="button"
              disabled={isOutOfStock}
              onClick={() => addItem(product)}
              aria-label={`Agregar ${product.name} al carrito`}
              className="flex h-11 min-w-0 flex-1 items-center justify-center gap-1.5 rounded-pill bg-accent px-4 text-sm font-semibold text-white shadow-accent transition-transform active:scale-95 disabled:cursor-not-allowed disabled:bg-black/10 disabled:text-muted disabled:shadow-none"
            >
              <Plus size={16} strokeWidth={2.5} aria-hidden />
              Agregar
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
