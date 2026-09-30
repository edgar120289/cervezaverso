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

type AccountContextValue = {
  user: User | null;
  /** Rol de `public.users`; sólo decide qué enlaces ve el header (el servidor vuelve a validar). */
  role: UserRole | null;
  isFavorite: (productId: string) => boolean;
  /** Sin sesión, manda a /login y regresa a la página actual después. */
  toggleFavorite: (productId: string) => Promise<void>;
  /** Cierra la sesión (cookies incluidas) y regresa al inicio. */
  signOut: () => Promise<void>;
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
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(() => new Set());

  useEffect(() => {
    if (!supabase) return;

    async function loadFavorites(currentUser: User | null) {
      setUser(currentUser);
      if (!currentUser) {
        setRole(null);
        setFavoriteIds(new Set());
        return;
      }
      const [{ data }, { data: profile }] = await Promise.all([
        supabase!.from("favorites").select("product_id"),
        supabase!.from("users").select("role").eq("id", currentUser.id).maybeSingle(),
      ]);
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

  const signOut = useCallback(async () => {
    await supabase?.auth.signOut();
    router.push("/");
    router.refresh();
  }, [supabase, router]);

  const value = useMemo(
    () => ({ user, role, isFavorite, toggleFavorite, signOut }),
    [user, role, isFavorite, toggleFavorite, signOut]
  );

  return <AccountContext.Provider value={value}>{children}</AccountContext.Provider>;
}

export function useAccount() {
  const ctx = useContext(AccountContext);
  if (!ctx) throw new Error("useAccount debe usarse dentro de <AccountProvider>");
  return ctx;
}
