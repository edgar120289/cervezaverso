"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { AppliedPromo, CartItem, Product } from "@/lib/types";
import { calculateOrderTotals, promoBase } from "@/lib/pricing";
import { getShippingZone, type ShippingZone } from "@/lib/shipping-zones";
import { useAccount } from "@/lib/account-context";
import { validarCodigoPromo } from "@/app/actions/promo";
import { revisarCarrito } from "@/app/actions/sugerencias";
import { MAX_LINE_QUANTITY } from "@/lib/validation";

/** Tiempo durante el que «Deshacer» recupera lo que se quitó. */
export const UNDO_MS = 8000;
/** Una revisión de precios y existencias por minuto basta. */
const REFRESH_EVERY_MS = 60_000;

export type RemovedLine = { item: CartItem; index: number; at: number };
/** `unavailable`: ya no se vende o se agotó; el checkout no deja continuar con ella. */
export type LineStatus = "ok" | "unavailable";

const STORAGE_KEY = "cervezaverso:cart";
const PROMO_STORAGE_KEY = "cervezaverso:promo";

type CartContextValue = {
  items: CartItem[];
  /** Abre el cajón del carrito salvo que se pida `{ openDrawer: false }` (p. ej. desde un modal). */
  addItem: (product: Product, quantity?: number, options?: { openDrawer?: boolean }) => void;
  /** Quita el renglón y lo deja en `lastRemoved` para poder deshacer. */
  removeItem: (productId: string) => void;
  /** Cambia la cantidad (de 1 a `MAX_LINE_QUANTITY`); con 0 o menos se quita. */
  setQuantity: (productId: string, quantity: number) => void;
  /** Último renglón quitado, para «Quitaste X · Deshacer». */
  lastRemoved: RemovedLine | null;
  undoRemove: () => void;
  dismissRemoved: () => void;
  /** Disponibilidad según la última revisión en el servidor. */
  lineStatus: (productId: string) => LineStatus;
  /** Relee precios y existencias del servidor (como mucho una vez por minuto, salvo `force`). */
  refresh: (force?: boolean) => void;
  clear: () => void;
  subtotal: number;
  /** Código aplicado (se conserva aunque aún no alcance la compra mínima). */
  promo: AppliedPromo | null;
  /** Valida el código en el servidor; devuelve el error a mostrar o null si se aplicó. */
  applyPromo: (code: string) => Promise<string | null>;
  removePromo: () => void;
  discount: number;
  /** Descuento por volumen (10% en compras mayores a $6,000), no acumulable con códigos. */
  volumeDiscount: number;
  /** Zona de envío según el CP de la dirección predeterminada; `null` mientras no se conozca el CP. */
  shippingZone: ShippingZone | null;
  /** Costo de envío estimado; `null` si aún no hay CP. El servidor recalcula con la dirección real. */
  shippingCost: number | null;
  /** Total; sin envío mientras `shippingCost` sea `null`. */
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
  const [lastRemoved, setLastRemoved] = useState<RemovedLine | null>(null);
  const [unavailable, setUnavailable] = useState<Set<string>>(() => new Set());
  const lastRefresh = useRef(0);
  const itemsRef = useRef<CartItem[]>([]);
  const lastRemovedRef = useRef<RemovedLine | null>(null);
  useEffect(() => {
    itemsRef.current = items;
    lastRemovedRef.current = lastRemoved;
  });

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
            ? { ...item, quantity: Math.min(MAX_LINE_QUANTITY, item.quantity + quantity) }
            : item
        );
      }
      return [...prev, { product, quantity: Math.min(MAX_LINE_QUANTITY, quantity) }];
    });
    if (options?.openDrawer !== false) setDrawerOpen(true);
  }, []);

  const removeItem = useCallback((productId: string) => {
    const prev = itemsRef.current;
    const index = prev.findIndex((item) => item.product.id === productId);
    if (index === -1) return;
    setLastRemoved({ item: prev[index], index, at: Date.now() });
    setItems(prev.filter((item) => item.product.id !== productId));
  }, []);

  const setQuantity = useCallback(
    (productId: string, quantity: number) => {
      if (quantity <= 0) {
        removeItem(productId);
        return;
      }
      const capped = Math.min(MAX_LINE_QUANTITY, Math.floor(quantity));
      setItems((prev) => prev.map((item) => (item.product.id === productId ? { ...item, quantity: capped } : item)));
    },
    [removeItem]
  );

  const undoRemove = useCallback(() => {
    const removed = lastRemovedRef.current;
    if (!removed) return;
    setLastRemoved(null);
    setItems((prev) => {
      if (prev.some((item) => item.product.id === removed.item.product.id)) return prev;
      const next = [...prev];
      next.splice(Math.min(removed.index, next.length), 0, removed.item);
      return next;
    });
  }, []);

  const dismissRemoved = useCallback(() => setLastRemoved(null), []);

  const refresh = useCallback((force = false) => {
    const current = itemsRef.current;
    if (current.length === 0) return;
    if (!force && Date.now() - lastRefresh.current < REFRESH_EVERY_MS) return;
    lastRefresh.current = Date.now();
    revisarCarrito(current.map((item) => item.product.id))
      .then((fresh) => {
        if (!fresh) return;
        const byId = new Map(fresh.map((product) => [product.id, product]));
        setUnavailable(
          new Set(
            current
              .filter((item) => byId.get(item.product.id)?.stock_status === "out_of_stock" || !byId.has(item.product.id))
              .map((item) => item.product.id)
          )
        );
        // Precio y datos actuales: lo que se ve es lo que se cobrará.
        setItems((prev) =>
          prev.map((item) => {
            const product = byId.get(item.product.id);
            return product && (product.sale_price !== item.product.sale_price || product.stock_status !== item.product.stock_status)
              ? { ...item, product: { ...item.product, sale_price: Number(product.sale_price), stock_status: product.stock_status } }
              : item;
          })
        );
      })
      .catch(() => undefined);
  }, []);

  const lineStatus = useCallback((productId: string): LineStatus => (unavailable.has(productId) ? "unavailable" : "ok"), [unavailable]);

  const clear = useCallback(() => {
    setItems([]);
    setPromo(null);
    setLastRemoved(null);
  }, []);

  const subtotal = useMemo(
    () => items.reduce((sum, item) => sum + item.product.sale_price * item.quantity, 0),
    [items]
  );
  const { defaultPostalCode } = useAccount();
  const shippingZone = useMemo<ShippingZone | null>(
    () => (defaultPostalCode && /^\d{5}$/.test(defaultPostalCode) ? getShippingZone({ codigo_postal: defaultPostalCode }) : null),
    [defaultPostalCode]
  );
  const { discount, volumeDiscount, shippingCost, total } = useMemo(() => {
    const base = promoBase(items.map((item) => ({ country: item.product.country, amount: item.product.sale_price * item.quantity })), promo);
    const totals = calculateOrderTotals(subtotal, promo, shippingZone ?? "nacional", base);
    // Sin CP no se supone ninguna zona: el envío queda fuera del total hasta conocerla.
    return shippingZone ? totals : { ...totals, shippingCost: null, total: totals.total - totals.shippingCost };
  }, [items, subtotal, promo, shippingZone]);
  const itemCount = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity, 0),
    [items]
  );

  const value: CartContextValue = {
    items,
    addItem,
    removeItem,
    setQuantity,
    lastRemoved,
    undoRemove,
    dismissRemoved,
    lineStatus,
    refresh,
    clear,
    subtotal,
    promo,
    applyPromo,
    removePromo,
    discount,
    volumeDiscount,
    shippingZone,
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
