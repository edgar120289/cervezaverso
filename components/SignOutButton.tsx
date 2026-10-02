"use client";

import { useState } from "react";
import { Loader2, LogOut } from "lucide-react";
import { useAccount } from "@/lib/account-context";

/** Botón de "Cerrar sesión" en tonos neutros de la marca (paneles /admin y /cuenta). */
export default function SignOutButton({ variant = "solid" }: { variant?: "solid" | "outline" }) {
  const { signOut } = useAccount();
  const [isPending, setIsPending] = useState(false);

  async function handleClick() {
    setIsPending(true);
    try {
      await signOut();
    } finally {
      setIsPending(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      className={`flex min-h-11 items-center gap-2 rounded-full px-5 text-sm font-semibold transition-colors active:scale-[0.98] disabled:opacity-60 ${
        variant === "outline"
          ? "border border-black/20 bg-transparent text-black/70 hover:bg-black/5 hover:text-black"
          : "bg-white text-black/75 shadow-card hover:bg-black hover:text-white"
      }`}
    >
      {isPending ? <Loader2 size={16} className="animate-spin" /> : <LogOut size={16} />}
      Cerrar sesión
    </button>
  );
}
