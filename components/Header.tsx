"use client";

import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import MultiverseLogo from "./MultiverseLogo";
import AccountMenu from "./AccountMenu";
import { useCart } from "@/lib/cart-context";

export default function Header({ logoImages }: { logoImages: string[] }) {
  const { itemCount, openDrawer } = useCart();

  return (
    <header className="sticky top-0 z-40 px-4 pt-4">
      <div className="mx-auto flex max-w-6xl items-center justify-between rounded-full bg-white/80 px-4 py-2.5 shadow-card backdrop-blur-lg">
        <Link href="/" className="flex items-center gap-2">
          <MultiverseLogo images={logoImages} size={40} priority />
          <span className="hidden text-lg font-semibold tracking-[-0.04em] sm:inline">
            Cervezaverso
          </span>
        </Link>

        <nav className="flex items-center gap-1.5">
          <AccountMenu />
          <button
            type="button"
            onClick={openDrawer}
            aria-label="Ver carrito"
            className="relative flex h-10 w-10 items-center justify-center rounded-full text-black/70 transition-colors hover:bg-black/5"
          >
            <ShoppingBag size={20} />
            {itemCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-black px-1 text-[10px] font-semibold text-white">
                {itemCount}
              </span>
            )}
          </button>
        </nav>
      </div>
    </header>
  );
}
