"use client";

import { useState } from "react";
import { Loader2, LogOut } from "lucide-react";
import { useAccount } from "@/lib/account-context";

/** Botón de "Cerrar sesión" en tonos neutros de la marca (paneles /admin y /cuenta). */
export default function SignOutButton() {
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
      className="flex min-h-11 items-center gap-2 rounded-full bg-white px-5 text-sm font-semibold text-black/75 shadow-card transition-colors hover:bg-black hover:text-white active:scale-[0.98] disabled:opacity-60"
    >
      {isPending ? <Loader2 size={16} className="animate-spin" /> : <LogOut size={16} />}
      Cerrar sesión
    </button>
  );
}
