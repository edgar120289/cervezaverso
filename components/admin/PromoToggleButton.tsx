"use client";

import { useTransition } from "react";
import { cambiarEstadoCupon } from "@/app/actions/admin-cupones";

export default function PromoToggleButton({ id, active }: { id: string; active: boolean }) {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() =>
        startTransition(async () => {
          const result = await cambiarEstadoCupon(id, !active);
          if (!result.ok) window.alert(result.error);
        })
      }
      className={`shrink-0 rounded-full px-4 py-2 text-xs font-semibold transition-colors disabled:opacity-50 ${
        active ? "bg-[#f2f4f5] hover:bg-black hover:text-white" : "bg-black text-white hover:bg-black/80"
      }`}
    >
      {isPending ? "Guardando…" : active ? "Desactivar" : "Reactivar"}
    </button>
  );
}
