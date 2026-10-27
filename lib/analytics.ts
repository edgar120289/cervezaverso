import { gaAddToCart, gaBeginCheckout } from "@/lib/google-tag";
import { trackAddToCart as metaAddToCart, trackInitiateCheckout as metaInitiateCheckout } from "@/lib/meta-pixel";
import type { CartItem, Product } from "@/lib/types";

/** Agregar al carrito: GA4 `add_to_cart` y Meta `AddToCart`. */
export function trackAddToCart(product: Product): void {
  gaAddToCart(product);
  metaAddToCart(product);
}

/** Paso del carrito al pago: GA4 `begin_checkout` y Meta `InitiateCheckout`. */
export function trackBeginCheckout(cartItems: CartItem[], totalPrice: number): void {
  gaBeginCheckout(cartItems, totalPrice);
  metaInitiateCheckout(cartItems, totalPrice);
}
