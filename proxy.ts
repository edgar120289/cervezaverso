import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { countryCategoryOf } from "@/lib/seo-categories";

function isAdminPage(pathname: string) {
  return pathname === "/admin" || pathname.startsWith("/admin/");
}

const PRODUCT_PATH = /^\/cervezas\/([^/]+)\/?$/;

/**
 * Cerveza retirada (`is_active = false`): 301 a su categoría de país, o a /tienda si no tiene una.
 * Depende del estado en cada visita, así que la ficha vuelve a funcionar si el producto se reactiva.
 * Se resuelve aquí y no en la página porque, con la pantalla de carga, la página ya respondió 200.
 */
async function retiredProductRedirect(request: NextRequest): Promise<NextResponse | null> {
  const match = PRODUCT_PATH.exec(request.nextUrl.pathname);
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!match || !url || !serviceKey) return null;

  try {
    const sku = decodeURIComponent(match[1]);
    const res = await fetch(`${url}/rest/v1/products?select=country&is_active=eq.false&sku=eq.${encodeURIComponent(sku)}&limit=1`, {
      headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` },
      signal: AbortSignal.timeout(2000),
    });
    if (!res.ok) return null;
    const rows: { country: string }[] = await res.json();
    if (rows.length === 0) return null;
    const category = countryCategoryOf({ country: rows[0].country });
    return NextResponse.redirect(new URL(category ? `/catalogo/pais/${category.slug}` : "/tienda", request.url), 301);
  } catch (err) {
    console.error("[proxy] No se pudo revisar si la cerveza está retirada:", err instanceof Error ? err.message : err);
    return null;
  }
}

export async function proxy(request: NextRequest) {
  const retired = await retiredProductRedirect(request);
  if (retired) return retired;

  let response = NextResponse.next({ request });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) {
    // Supabase aún no está configurado (ver .env.example); no hay sesión que refrescar.
    return response;
  }

  const { pathname, search } = request.nextUrl;

  // Sin cookies de sesión de Supabase (`sb-…`) no hay token que refrescar y `getUser()` devolvería
  // `null` de todos modos: se evita la llamada de red. Con cookies (sesión, PKCE de OAuth) sigue igual.
  const hasSupabaseCookies = request.cookies.getAll().some((cookie) => cookie.name.startsWith("sb-"));
  if (!hasSupabaseCookies) {
    if (pathname.startsWith("/cuenta") || isAdminPage(pathname)) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("next", pathname + search);
      return NextResponse.redirect(loginUrl);
    }
    return response;
  }

  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresca la sesión (necesario para que los Server Components vean el token vigente).
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // El rol admin se valida en el layout de /admin, en `requireAdmin` y en /api/admin/import.
  if (!user && (pathname.startsWith("/cuenta") || isAdminPage(pathname))) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname + search);
    const redirect = NextResponse.redirect(loginUrl);
    // Conserva las cookies que Supabase haya limpiado o renovado en este request.
    response.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));
    return redirect;
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|webp|mp4)$).*)"],
};
