"use client";

import { Suspense } from "react";
import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import Image from "next/image";
import MultiverseLogo from "./MultiverseLogo";
import AccountMenu from "./AccountMenu";
import HeaderSearch from "./HeaderSearch";
import { useCart } from "@/lib/cart-context";

export default function Header({ logoImages }: { logoImages: string[] }) {
  const { itemCount, openDrawer } = useCart();

  return (
    <header className="sticky top-0 z-40 px-4 pt-4">
      <div className="relative mx-auto flex max-w-6xl items-center justify-between gap-3 rounded-full bg-white/80 px-4 py-2 shadow-card backdrop-blur-lg">
        <Link href="/" aria-label="Cervezaverso, inicio" className="flex shrink-0 items-center gap-2 py-0.5 pr-2">
          <MultiverseLogo images={logoImages} size={40} priority />
          <Image
            src="/img/cervezaverso-logos-v2/marcos/marco-horizontal.png"
            alt="Cervezaverso"
            width={922}
            height={320}
            priority
            sizes="(min-width: 640px) 130px, 104px"
            className="h-9 w-auto sm:h-11"
          />
        </Link>

        <div className="flex flex-1 items-center justify-end gap-1.5">
          {/* useSearchParams: el buscador se hidrata aparte para no volver dinámico todo el layout. */}
          <Suspense fallback={null}>
            <HeaderSearch />
          </Suspense>
          <nav aria-label="Cuenta y carrito" className="flex items-center gap-1.5">
            <AccountMenu />
            <button
              type="button"
              onClick={openDrawer}
              aria-label={itemCount > 0 ? `Ver carrito, ${itemCount} productos` : "Ver carrito"}
              className="relative flex h-11 w-11 items-center justify-center rounded-full text-black/70 transition-colors hover:bg-black/5"
            >
              <ShoppingBag size={20} />
              {itemCount > 0 && (
                <span
                  aria-hidden
                  className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-black px-1 text-[10px] font-semibold text-white"
                >
                  {itemCount}
                </span>
              )}
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
}
