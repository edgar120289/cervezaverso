import type { Metadata } from "next";
import Link from "next/link";
import { getProducts } from "@/lib/catalog";
import { normalCase } from "@/lib/text-case";

export const metadata: Metadata = {
  title: "Todas las cervezas",
  description: "Directorio de todas las cervezas de Cervezaverso, ordenadas por país: artesanales e importadas con su estilo y presentación.",
  alternates: { canonical: "/directorio" },
};

export const revalidate = 3600;

/**
 * Directorio de todas las cervezas activas, agrupadas por país, con enlace real a cada ficha.
 * La tienda carga 24 a la vez con un botón; el directorio asegura que cada ficha tenga al menos un enlace en el HTML.
 */
export default async function DirectorioPage() {
  const products = await getProducts();
  const groups = new Map<string, typeof products>();
  for (const p of products) {
    const key = normalCase(p.country) || "Otros";
    groups.set(key, [...(groups.get(key) ?? []), p]);
  }
  const countries = [...groups.entries()].sort((a, b) => b[1].length - a[1].length || a[0].localeCompare(b[0], "es"));

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 pt-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-[-0.04em] sm:text-3xl">Todas las cervezas</h1>
        <p className="mt-1 max-w-2xl text-muted">
          {products.length} cervezas de {countries.length} países. Para filtrar por precio, estilo o cervecería, usa la{" "}
          <Link href="/tienda" className="font-semibold text-accent hover:underline">
            tienda
          </Link>
          .
        </p>
        <nav aria-label="Países" className="mt-4 flex flex-wrap gap-2">
          {countries.map(([country, list]) => (
            <a key={country} href={`#${encodeURIComponent(country)}`} className="rounded-full bg-white px-4 py-2 text-sm font-semibold shadow-card">
              {country} <span className="text-muted">({list.length})</span>
            </a>
          ))}
        </nav>
      </header>
      {countries.map(([country, list]) => (
        <section key={country} id={encodeURIComponent(country)} className="scroll-mt-24">
          <h2 className="text-xl font-semibold tracking-[-0.03em]">
            Cerveza de {country} <span className="text-base font-normal text-muted">({list.length})</span>
          </h2>
          <ul className="mt-3 grid gap-x-8 gap-y-1 sm:grid-cols-2 lg:grid-cols-3">
            {list
              .slice()
              .sort((a, b) => a.name.localeCompare(b.name, "es"))
              .map((p) => (
                <li key={p.id}>
                  <Link href={`/cervezas/${p.sku}`} className="block min-h-11 py-2 text-sm hover:underline">
                    <span className="font-semibold">{normalCase(p.name)}</span>
                    <span className="text-muted"> · {normalCase(p.style)}</span>
                  </Link>
                </li>
              ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
