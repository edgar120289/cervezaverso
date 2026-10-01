import { createServerClient } from "@supabase/ssr";
import { createHash, timingSafeEqual } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";

const DEV_ADMIN_USER = "admin";
const DEV_ADMIN_PASSWORD = "cerveza2026";

function isAdminPath(pathname: string) {
  return (
    pathname === "/admin" ||
    pathname.startsWith("/admin/") ||
    pathname === "/api/admin" ||
    pathname.startsWith("/api/admin/")
  );
}

function safeEqual(a: string, b: string) {
  const hashA = createHash("sha256").update(a).digest();
  const hashB = createHash("sha256").update(b).digest();
  return timingSafeEqual(hashA, hashB);
}

function basicAuthChallenge() {
  return new NextResponse("Autenticación requerida.", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="Cervezaverso Admin", charset="UTF-8"' },
  });
}

// HTTP Basic Auth para /admin. Los valores por defecto solo aplican fuera de producción.
function guardAdmin(request: NextRequest) {
  const isProduction = process.env.NODE_ENV === "production";
  const user = process.env.ADMIN_USER || (isProduction ? undefined : DEV_ADMIN_USER);
  const password = process.env.ADMIN_PASSWORD || (isProduction ? undefined : DEV_ADMIN_PASSWORD);

  if (!user || !password) {
    console.error("ADMIN_USER y ADMIN_PASSWORD no están definidas: /admin bloqueado.");
    return new NextResponse("Servicio no disponible.", { status: 503 });
  }

  const header = request.headers.get("authorization") ?? "";
  const [scheme, encoded] = header.split(" ");
  if (scheme?.toLowerCase() === "basic" && encoded) {
    const decoded = Buffer.from(encoded, "base64").toString("utf-8");
    const separator = decoded.indexOf(":");
    if (separator !== -1) {
      const userOk = safeEqual(decoded.slice(0, separator), user);
      const passwordOk = safeEqual(decoded.slice(separator + 1), password);
      if (userOk && passwordOk) return null;
    }
  }
  return basicAuthChallenge();
}

export async function proxy(request: NextRequest) {
  if (isAdminPath(request.nextUrl.pathname)) {
    const denied = guardAdmin(request);
    if (denied) return denied;
  }

  let response = NextResponse.next({ request });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) {
    // Supabase aún no está configurado (ver .env.example); no hay sesión que refrescar.
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

  const { pathname, search } = request.nextUrl;
  if (!user && pathname.startsWith("/cuenta")) {
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
