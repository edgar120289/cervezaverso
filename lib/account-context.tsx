"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import type { UserRole } from "@/lib/types";
import { LINKED_ORDERS_COOKIE } from "@/lib/linked-orders";

function readCookie(name: string): string | null {
  const match = document.cookie.split("; ").find((part) => part.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.slice(name.length + 1)) : null;
}

function nameFor(user: User | null, profileName: string | null): string {
  const fromMeta = typeof user?.user_metadata?.full_name === "string" ? user.user_metadata.full_name : "";
  const full = (profileName || fromMeta).trim();
  return full ? full.split(/\s+/)[0] : (user?.email?.split("@")[0] ?? "");
}

type AccountContextValue = {
  user: User | null;
  /** Rol de `public.users`; sólo decide qué enlaces ve el header (el servidor vuelve a validar). */
  role: UserRole | null;
  /** Nombre para mostrar (perfil, Google o la parte local del correo). */
  displayName: string;
  /** Hay algo nuevo para el cliente: un premio sin canjear o pedidos de invitado recién ligados. */
  hasNews: boolean;
  /** CP de la dirección predeterminada (o la más reciente) del cliente con sesión; sirve para estimar el envío. */
  defaultPostalCode: string | null;
  isFavorite: (productId: string) => boolean;
  /** Sin sesión, manda a /login y regresa a la página actual después. */
  toggleFavorite: (productId: string) => Promise<void>;
  /** Cierra la sesión (cookies incluidas) y va a `redirectTo` (por defecto, el inicio). */
  signOut: (redirectTo?: string) => Promise<void>;
};

const AccountContext = createContext<AccountContextValue | null>(null);

/**
 * Sesión y favoritos del cliente. Se leen desde el navegador (RLS limita
 * `favorites` a las filas del propio usuario) para que el layout no tenga que
 * volverse dinámico en todas las páginas.
 */
export function AccountProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [supabase] = useState(() =>
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? createClient() : null
  );
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [defaultPostalCode, setDefaultPostalCode] = useState<string | null>(null);
  const [profileName, setProfileName] = useState<string | null>(null);
  const [hasRewards, setHasRewards] = useState(false);
  const [hasLinked, setHasLinked] = useState(false);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(() => new Set());

  useEffect(() => {
    if (!supabase) return;

    async function loadFavorites(currentUser: User | null) {
      setUser(currentUser);
      if (!currentUser) {
        setRole(null);
        setDefaultPostalCode(null);
        setProfileName(null);
        setHasRewards(false);
        setHasLinked(false);
        setFavoriteIds(new Set());
        return;
      }
      setHasLinked(Boolean(readCookie(LINKED_ORDERS_COOKIE)));
      const [{ data }, { data: profile }, { data: direccion }, { count: premios }] = await Promise.all([
        supabase!.from("favorites").select("product_id"),
        supabase!.from("users").select("role, full_name").eq("id", currentUser.id).maybeSingle(),
        supabase!
          .from("direcciones")
          .select("codigo_postal")
          .order("predeterminada", { ascending: false })
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
        // Premios sin canjear (la RLS solo deja ver los propios).
        supabase!
          .from("promo_codes")
          .select("id", { count: "exact", head: true })
          .not("reward_level", "is", null)
          .eq("active", true)
          .eq("times_used", 0),
      ]);
      setProfileName(typeof profile?.full_name === "string" ? profile.full_name : null);
      setHasRewards((premios ?? 0) > 0);
      setDefaultPostalCode(typeof direccion?.codigo_postal === "string" ? direccion.codigo_postal : null);
      setRole(profile?.role === "admin" ? "admin" : "client");
      setFavoriteIds(new Set((data ?? []).map((row) => row.product_id as string)));
    }

    const { data: subscription } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "INITIAL_SESSION" || event === "SIGNED_IN" || event === "SIGNED_OUT") {
        // Fuera del callback: supabase-js no permite otra llamada dentro de onAuthStateChange.
        setTimeout(() => loadFavorites(session?.user ?? null), 0);
      }
    });
    return () => subscription.subscription.unsubscribe();
  }, [supabase]);

  const isFavorite = useCallback((productId: string) => favoriteIds.has(productId), [favoriteIds]);

  const toggleFavorite = useCallback(
    async (productId: string) => {
      if (!supabase || !user) {
        router.push(`/login?next=${encodeURIComponent(pathname)}`);
        return;
      }
      const wasFavorite = favoriteIds.has(productId);
      const optimistic = new Set(favoriteIds);
      if (wasFavorite) optimistic.delete(productId);
      else optimistic.add(productId);
      setFavoriteIds(optimistic);

      const { error } = wasFavorite
        ? await supabase.from("favorites").delete().eq("user_id", user.id).eq("product_id", productId)
        : await supabase.from("favorites").insert({ user_id: user.id, product_id: productId });
      if (error) setFavoriteIds(favoriteIds);
    },
    [supabase, user, favoriteIds, router, pathname]
  );

  const signOut = useCallback(
    async (redirectTo = "/") => {
      await supabase?.auth.signOut();
      router.push(redirectTo);
      router.refresh();
    },
    [supabase, router]
  );

  const displayName = nameFor(user, profileName);
  const hasNews = Boolean(user) && (hasRewards || hasLinked);

  const value = useMemo(
    () => ({ user, role, displayName, hasNews, defaultPostalCode, isFavorite, toggleFavorite, signOut }),
    [user, role, displayName, hasNews, defaultPostalCode, isFavorite, toggleFavorite, signOut]
  );

  return <AccountContext.Provider value={value}>{children}</AccountContext.Provider>;
}

export function useAccount() {
  const ctx = useContext(AccountContext);
  if (!ctx) throw new Error("useAccount debe usarse dentro de <AccountProvider>");
  return ctx;
}
