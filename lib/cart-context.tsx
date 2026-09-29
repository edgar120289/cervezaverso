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
import type { AppliedPromo, CartItem, Product } from "@/lib/types";
import { calculateOrderTotals } from "@/lib/pricing";
import { validarCodigoPromo } from "@/app/actions/promo";

const STORAGE_KEY = "cervezaverso:cart";
const PROMO_STORAGE_KEY = "cervezaverso:promo";

type CartContextValue = {
  items: CartItem[];
  /** Abre el cajón del carrito salvo que se pida `{ openDrawer: false }` (p. ej. desde un modal). */
  addItem: (product: Product, quantity?: number, options?: { openDrawer?: boolean }) => void;
  removeItem: (productId: string) => void;
  setQuantity: (productId: string, quantity: number) => void;
  clear: () => void;
  subtotal: number;
  /** Código aplicado (se conserva aunque aún no alcance la compra mínima). */
  promo: AppliedPromo | null;
  /** Valida el código en el servidor; devuelve el error a mostrar o null si se aplicó. */
  applyPromo: (code: string) => Promise<string | null>;
  removePromo: () => void;
  discount: number;
  /** Envío nacional estimado (el checkout recalcula según el método elegido). */
  shippingCost: number;
  total: number;
  itemCount: number;
  /** false hasta leer localStorage: evita mostrar "carrito vacío" por un instante. */
  isHydrated: boolean;
  isDrawerOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isDrawerOpen, setDrawerOpen] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  const [promo, setPromo] = useState<AppliedPromo | null>(null);

  useEffect(() => {
    // Se hidrata desde localStorage tras montar (no disponible en el servidor).
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (stored) setItems(JSON.parse(stored));
      const storedPromo = window.localStorage.getItem(PROMO_STORAGE_KEY);
      if (storedPromo) setPromo(JSON.parse(storedPromo));
    } catch {
      // localStorage no disponible; el carrito arranca vacío.
    }
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (!isHydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // Ignorar si el almacenamiento está lleno o bloqueado.
    }
  }, [items, isHydrated]);

  useEffect(() => {
    if (!isHydrated) return;
    try {
      if (promo) window.localStorage.setItem(PROMO_STORAGE_KEY, JSON.stringify(promo));
      else window.localStorage.removeItem(PROMO_STORAGE_KEY);
    } catch {
      // Ignorar si el almacenamiento está bloqueado.
    }
  }, [promo, isHydrated]);

  const applyPromo = useCallback(async (code: string) => {
    try {
      const result = await validarCodigoPromo(code);
      if (!result.ok) return result.error;
      setPromo(result.promo);
      return null;
    } catch {
      return "No pudimos validar el código. Revisa tu conexión e intenta de nuevo.";
    }
  }, []);

  const removePromo = useCallback(() => setPromo(null), []);

  const addItem = useCallback((product: Product, quantity = 1, options?: { openDrawer?: boolean }) => {
    setItems((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prev, { product, quantity }];
    });
    if (options?.openDrawer !== false) setDrawerOpen(true);
  }, []);

  const removeItem = useCallback((productId: string) => {
    setItems((prev) => prev.filter((item) => item.product.id !== productId));
  }, []);

  const setQuantity = useCallback((productId: string, quantity: number) => {
    setItems((prev) => {
      if (quantity <= 0) return prev.filter((item) => item.product.id !== productId);
      return prev.map((item) =>
        item.product.id === productId ? { ...item, quantity } : item
      );
    });
  }, []);

  const clear = useCallback(() => {
    setItems([]);
    setPromo(null);
  }, []);

  const subtotal = useMemo(
    () => items.reduce((sum, item) => sum + item.product.sale_price * item.quantity, 0),
    [items]
  );
  const { discount, shippingCost, total } = useMemo(
    () => calculateOrderTotals(subtotal, "nacional", promo),
    [subtotal, promo]
  );
  const itemCount = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity, 0),
    [items]
  );

  const value: CartContextValue = {
    items,
    addItem,
    removeItem,
    setQuantity,
    clear,
    subtotal,
    promo,
    applyPromo,
    removePromo,
    discount,
    shippingCost,
    total,
    itemCount,
    isHydrated,
    isDrawerOpen,
    openDrawer: () => setDrawerOpen(true),
    closeDrawer: () => setDrawerOpen(false),
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart debe usarse dentro de <CartProvider>");
  return ctx;
}
