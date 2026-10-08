import "server-only";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { calculateOrderTotals, formatMXN } from "@/lib/pricing";
import { findActivePromo } from "@/lib/promo";
import { checkoutSchema, firstIssue } from "@/lib/validation";
import { guardPublicForm } from "@/lib/security/form-guard";
import { getProfileBirthDate } from "@/lib/profile";
import type { AppliedPromo, DireccionEnvio } from "@/lib/types";

export type PedidoRegistrado = {
  pedidoId: string;
  email: string;
  nombre: string;
  telefono: string;
  lineas: { sku: string; nombre: string; precio_unitario: number; cantidad: number }[];
  subtotal: number;
  descuento: number;
  costoEnvio: number;
  total: number;
  promoId: string | null;
};

export type RegistroResult =
  | ({ ok: true } & PedidoRegistrado)
  | { ok: false; error: string; /** El código ya no sirve: el cliente debe quitarlo. */ promoInvalid?: boolean };

/** Libera un cupón canjeado cuando el pedido no llegó a la pasarela. */
export async function liberarPromo(promoId: string | null): Promise<void> {
  if (promoId) await createAdminClient().rpc("release_promo_code", { p_id: promoId });
}

/**
 * Crea el pedido en estado Pendiente. Los precios y el stock se leen de Supabase: los del carrito
 * (localStorage) sólo sirven para mostrar, nunca para cobrar. Si hay sesión,
 * el pedido queda en el historial del cliente y la dirección se guarda en su
 * libreta como predeterminada para la próxima compra en 1 clic.
 */
export async function registrarPedido(input: unknown): Promise<RegistroResult> {
  const parsed = checkoutSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: firstIssue(parsed.error) };
  const { email, metodo_envio, direccion, notas, items, promo_code, fecha_nacimiento, website, turnstileToken } =
    parsed.data;

  const guard = await guardPublicForm("checkout", { honeypot: website, turnstileToken });
  if (!guard.ok) return guard;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Venta de alcohol: toda compra queda ligada a una fecha de nacimiento de mayor de edad
  // (la de la cuenta o, como invitado, la que se captura aquí; el esquema ya validó los 18 años).
  const fechaNacimiento = (user && (await getProfileBirthDate(user.id))) || fecha_nacimiento;
  if (!fechaNacimiento) {
    return { ok: false, error: "Escribe tu fecha de nacimiento para confirmar que eres mayor de edad." };
  }

  const admin = createAdminClient();
  const productIds = [...new Set(items.map((item) => item.product_id))];
  const { data: products, error: productsError } = await admin
    .from("products")
    .select("id, sku, name, sale_price, stock_status, is_active")
    .in("id", productIds);
  if (productsError) return { ok: false, error: "No pudimos confirmar los precios. Intenta de nuevo." };

  const byId = new Map(products.map((product) => [product.id, product]));
  const lineas = [];
  for (const { product_id, cantidad } of items) {
    const product = byId.get(product_id);
    // La service role no pasa por RLS: un producto inactivo se trata aquí como no disponible.
    if (!product || !product.is_active) return { ok: false, error: "Uno de los productos ya no está disponible. Revisa tu carrito." };
    if (product.stock_status === "out_of_stock") {
      return { ok: false, error: `${product.name} se agotó. Quítala del carrito para continuar.` };
    }
    const precio = Number(product.sale_price);
    lineas.push({
      product_id,
      sku: product.sku,
      nombre: product.name,
      precio_unitario: precio,
      cantidad,
      importe: precio * cantidad,
    });
  }

  const subtotal = lineas.reduce((sum, linea) => sum + linea.importe, 0);

  // El código se valida de nuevo aquí: lo que diga el navegador no cuenta.
  let promo: (AppliedPromo & { id: string }) | null = null;
  if (promo_code) {
    const found = await findActivePromo(promo_code);
    if (!found.ok) return { ok: false, error: found.error, promoInvalid: true };
    if (subtotal < found.promo.min_purchase) {
      return {
        ok: false,
        error: `El código ${found.promo.code} requiere una compra mínima de ${formatMXN(found.promo.min_purchase)}.`,
        promoInvalid: true,
      };
    }
    // Canje atómico: si era la última vez disponible y alguien más la usó, aquí falla.
    const { data: redeemed, error: redeemError } = await admin.rpc("redeem_promo_code", { p_code: promo_code });
    if (redeemError || !redeemed?.length) {
      return { ok: false, error: "Este código ya fue utilizado.", promoInvalid: true };
    }
    promo = found.promo;
  }
  const releasePromo = async () => {
    if (promo) await admin.rpc("release_promo_code", { p_id: promo.id });
  };

  const { discount, shippingCost: costoEnvio, total } = calculateOrderTotals(subtotal, metodo_envio, promo);
  const direccionEnvio: DireccionEnvio = direccion;

  const { data: pedido, error: pedidoError } = await admin
    .from("pedidos")
    .insert({
      user_id: user?.id ?? null,
      cliente_nombre: direccion.nombre_completo,
      cliente_email: email,
      cliente_telefono: direccion.telefono,
      metodo_envio,
      subtotal,
      costo_envio: costoEnvio,
      total,
      direccion: direccionEnvio,
      notas,
      cliente_fecha_nacimiento: fechaNacimiento,
      // Sólo se envían con cupón: sin él, el checkout funciona aunque falte la migración 004.
      ...(promo ? { promo_code: promo.code, descuento: discount } : {}),
    })
    .select("id")
    .single();
  if (pedidoError) {
    console.error("[checkout] Error al crear el pedido:", pedidoError.message);
    await releasePromo();
    return { ok: false, error: "No pudimos registrar tu pedido. Intenta de nuevo." };
  }

  const { error: itemsError } = await admin
    .from("pedido_items")
    .insert(lineas.map((linea) => ({ ...linea, pedido_id: pedido.id })));
  if (itemsError) {
    console.error("[checkout] Error al guardar los renglones:", itemsError.message);
    await admin.from("pedidos").delete().eq("id", pedido.id);
    await releasePromo();
    return { ok: false, error: "No pudimos registrar tu pedido. Intenta de nuevo." };
  }

  if (user) await guardarDireccion(user.id, direccionEnvio);

  return {
    ok: true,
    pedidoId: pedido.id,
    email,
    nombre: direccion.nombre_completo,
    telefono: direccion.telefono,
    lineas: lineas.map(({ sku, nombre, precio_unitario, cantidad }) => ({ sku, nombre, precio_unitario, cantidad })),
    subtotal,
    descuento: promo ? discount : 0,
    costoEnvio,
    total,
    promoId: promo?.id ?? null,
  };
}

/** Guarda la dirección (sin duplicarla) y la deja como predeterminada. */
async function guardarDireccion(userId: string, direccion: DireccionEnvio) {
  const admin = createAdminClient();
  try {
    const { data: existentes } = await admin
      .from("direcciones")
      .select("id, nombre_completo, telefono, calle, colonia, ciudad, estado, codigo_postal, referencias")
      .eq("user_id", userId);

    const misma = existentes?.find((guardada) =>
      (Object.keys(direccion) as (keyof DireccionEnvio)[]).every(
        (campo) => (guardada[campo] ?? null) === (direccion[campo] ?? null)
      )
    );

    // El índice único permite una sola predeterminada: primero se quitan las demás.
    await admin.from("direcciones").update({ predeterminada: false }).eq("user_id", userId);
    if (misma) {
      await admin.from("direcciones").update({ predeterminada: true }).eq("id", misma.id);
    } else {
      await admin.from("direcciones").insert({ ...direccion, user_id: userId, predeterminada: true });
    }
  } catch (err) {
    // El pedido ya existe; no guardar la dirección no debe romper la compra.
    console.error("[checkout] No se pudo guardar la dirección:", err);
  }
}
