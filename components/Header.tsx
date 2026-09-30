"use client";

import { Suspense } from "react";
import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import Image from "next/image";
import MultiverseLogo from "./MultiverseLogo";
import AccountMenu from "./AccountMenu";
import HeaderSearch from "./HeaderSearch";
import MobileMenu from "./MobileMenu";
import { useCart } from "@/lib/cart-context";

export default function Header({ logoImages }: { logoImages: string[] }) {
  const { itemCount, openDrawer } = useCart();

  return (
    <header className="sticky top-0 z-40 px-4 pt-4">
      {/* Móvil: hamburguesa | logotipo al centro | carrito. Desde md: logotipo, buscador, cuenta y carrito. */}
      <div className="relative mx-auto grid max-w-6xl grid-cols-[1fr_auto_1fr] items-center gap-3 rounded-full bg-white/80 px-3 py-2 shadow-card backdrop-blur-lg md:flex md:justify-between md:px-4">
        <div className="md:hidden">
          <MobileMenu />
        </div>

        <div className="flex shrink-0 items-center gap-2 py-0.5 md:pr-2">
          <MultiverseLogo images={logoImages} size={40} priority />
          {/* El PNG trae ~34% de margen transparente a la izquierda; se recorta para que el logotipo quede pegado al tarro. */}
          <Link
            href="/"
            aria-label="Cervezaverso, inicio"
            className="relative block h-9 aspect-[574/320] overflow-hidden sm:h-11"
          >
            <Image
              src="/img/cervezaverso-logos-v2/marcos/marco-horizontal.png"
              alt="Cervezaverso"
              fill
              priority
              quality={100}
              sizes="(min-width: 640px) 127px, 104px"
              className="object-cover object-[88.5%_50%]"
            />
          </Link>
        </div>

        <div className="flex items-center justify-end gap-1.5 md:flex-1">
          <div className="hidden w-full justify-end md:flex">
            {/* useSearchParams: el buscador se hidrata aparte para no volver dinámico todo el layout. */}
            <Suspense fallback={null}>
              <HeaderSearch />
            </Suspense>
          </div>
          <nav aria-label="Cuenta y carrito" className="flex items-center gap-1.5">
            <div className="hidden md:block">
              <AccountMenu />
            </div>
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
