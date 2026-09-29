"use client";

import { Heart } from "lucide-react";
import { useAccount } from "@/lib/account-context";

export default function FavoriteButton({
  productId,
  productName,
  size = "sm",
}: {
  productId: string;
  productName: string;
  size?: "sm" | "lg";
}) {
  const { isFavorite, toggleFavorite } = useAccount();
  const active = isFavorite(productId);

  return (
    <button
      type="button"
      onClick={() => toggleFavorite(productId)}
      aria-pressed={active}
      aria-label={active ? `Quitar ${productName} de favoritos` : `Guardar ${productName} en favoritos`}
      className={`flex shrink-0 items-center justify-center rounded-pill border bg-surface transition-[transform,colors] active:scale-90 ${
        active ? "border-accent/25 text-accent" : "border-black/10 text-muted hover:border-black/20 hover:text-black/70"
      } ${size === "lg" ? "h-[52px] w-[52px]" : "h-10 w-10"}`}
    >
      <Heart size={size === "lg" ? 20 : 17} strokeWidth={2.25} fill={active ? "currentColor" : "none"} />
    </button>
  );
}
