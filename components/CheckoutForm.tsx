"use client";

import { useState, useTransition, type FormEvent } from "react";
import Link from "next/link";
import { LEGAL } from "@/lib/site";
import { useRouter } from "next/navigation";
import { Check, MapPin, Truck, Zap } from "lucide-react";
import { useCart } from "@/lib/cart-context";
import {
  calculateOrderTotals,
  calculateShippingCost,
  formatMXN,
  FREE_SHIPPING_THRESHOLD,
  isLocalShippingState,
  SHIPPING_METHODS,
  type ShippingMethod,
} from "@/lib/pricing";
import { ESTADOS_MX } from "@/lib/estados-mx";
import { checkoutSchema, firstIssue, isHoneypotFilled, MAX_NOTAS } from "@/lib/validation";
import { crearPedido } from "@/app/actions/checkout";
import PromoCodeField, { DiscountRow } from "@/components/PromoCodeField";
import Honeypot from "@/components/Honeypot";
import Turnstile, { TURNSTILE_ENABLED } from "@/components/Turnstile";
import FormField from "@/components/FormField";
import HealthNotice from "@/components/HealthNotice";
import PrivacyNotice from "@/components/PrivacyNotice";
import type { Direccion, DireccionEnvio } from "@/lib/types";

const NUEVA = "nueva";

const EMPTY_DIRECCION: DireccionEnvio = {
  nombre_completo: "",
  telefono: "",
  calle: "",
  colonia: "",
  ciudad: "",
  estado: "",
  codigo_postal: "",
  referencias: "",
};

const inputClass =
  "w-full rounded-full bg-canvas px-5 py-3.5 text-base outline-none transition-shadow placeholder:text-muted focus-visible:ring-2 focus-visible:ring-accent";

function formatDireccion(d: DireccionEnvio): string {
  return `${d.calle}, ${d.colonia}, ${d.ciudad}, ${d.estado}, C.P. ${d.codigo_postal}`;
}

export default function CheckoutForm({
  email: initialEmail,
  direcciones,
  isLoggedIn,
  requiresBirthDate,
}: {
  email: string;
  direcciones: Direccion[];
  isLoggedIn: boolean;
  /** Invitados y cuentas sin fecha registrada deben confirmar su mayoría de edad aquí. */
  requiresBirthDate: boolean;
}) {
  const router = useRouter();
  const { items, subtotal, isHydrated, clear, promo, removePromo } = useCart();
  const [isPending, startTransition] = useTransition();
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const predeterminada = direcciones.find((d) => d.predeterminada) ?? direcciones[0];
  const [email, setEmail] = useState(initialEmail);
  const [seleccion, setSeleccion] = useState<string>(predeterminada?.id ?? NUEVA);
  const [nueva, setNueva] = useState<DireccionEnvio>(EMPTY_DIRECCION);
  const [notas, setNotas] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [turnstileReset, setTurnstileReset] = useState(0);

  const guardada = direcciones.find((d) => d.id === seleccion);
  const direccion: DireccionEnvio = guardada ?? nueva;
  const localDisponible = isLocalShippingState(direccion.estado);
  const [metodoElegido, setMetodo] = useState<ShippingMethod>(
    predeterminada && isLocalShippingState(predeterminada.estado) ? "local" : "nacional"
  );
  // Si cambian a una dirección fuera de CDMX/Edomex, el envío local deja de aplicar.
  const metodo: ShippingMethod = metodoElegido === "local" && !localDisponible ? "nacional" : metodoElegido;

  const { discount, shippingCost: costoEnvio, total } = calculateOrderTotals(subtotal, metodo, promo);
  const faltaParaGratis = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);

  if (!isHydrated || isRedirecting) {
    return <div className="h-96 animate-pulse rounded-[28px] bg-white shadow-card" />;
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto flex max-w-lg flex-col items-center gap-4 rounded-[28px] bg-white px-6 py-16 text-center shadow-card">
        <h2 className="text-2xl font-semibold tracking-tight">Tu carrito está vacío</h2>
        <p className="text-muted">Agrega cervezas del catálogo para hacer tu pedido.</p>
        <Link href="/" className="mt-2 rounded-full bg-accent px-7 py-3.5 font-semibold text-white shadow-accent">
          Explorar catálogo
        </Link>
      </div>
    );
  }

  function updateNueva(campo: keyof DireccionEnvio, value: string) {
    setNueva((prev) => ({ ...prev, [campo]: value }));
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (isHoneypotFilled(honeypot)) return;

    const input = {
      email,
      metodo_envio: metodo,
      direccion: {
        nombre_completo: direccion.nombre_completo,
        telefono: direccion.telefono,
        calle: direccion.calle,
        colonia: direccion.colonia,
        ciudad: direccion.ciudad,
        estado: direccion.estado,
        codigo_postal: direccion.codigo_postal,
        referencias: direccion.referencias ?? "",
      },
      notas,
      items: items.map(({ product, quantity }) => ({ product_id: product.id, cantidad: quantity })),
      // Sólo si ya alcanza la compra mínima; si no, el pedido va sin código.
      promo_code: promo && discount > 0 ? promo.code : null,
      fecha_nacimiento: requiresBirthDate ? birthDate : null,
      website: honeypot,
      turnstileToken,
    };

    // Misma validación que el servidor, para avisar sin esperar la red.
    const parsed = checkoutSchema.safeParse(input);
    if (!parsed.success) {
      setError(firstIssue(parsed.error));
      return;
    }
    if (TURNSTILE_ENABLED && !turnstileToken) {
      setError("Espera un momento a que terminemos de verificar tu navegador.");
      return;
    }

    startTransition(async () => {
      const result = await crearPedido(input);
      // Cada token de Turnstile sirve una sola vez.
      setTurnstileReset((n) => n + 1);
      if (!result.ok) {
        // El código dejó de servir (se agotó o lo desactivaron): se quita y los totales se recalculan.
        if (result.promoInvalid) removePromo();
        setError(result.promoInvalid ? `${result.error} Lo quitamos de tu pedido; revisa el total.` : result.error);
        return;
      }
      setIsRedirecting(true);
      clear();
      router.push(`/pedido/${result.pedidoId}?confirmado=1`);
    });
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="relative grid gap-6 lg:grid-cols-[1fr_380px]">
      <Honeypot value={honeypot} onChange={setHoneypot} />
      <div className="space-y-4">
        {/* Contacto */}
        <section className="rounded-[28px] bg-white p-6 shadow-card">
          <SectionTitle step={1} title="Contacto" />
          <div className="space-y-3">
            <FormField id="checkout-email" label="Correo electrónico">
              <input
                id="checkout-email"
                type="email"
                name="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputClass}
              />
            </FormField>
            {requiresBirthDate && (
              <FormField
                id="checkout-nacimiento"
                label="Fecha de nacimiento"
                hint="Confirmamos que eres mayor de 18 años. Al recibir tu pedido se pedirá identificación oficial."
              >
                <input
                  id="checkout-nacimiento"
                  type="date"
                  name="fecha_nacimiento"
                  autoComplete="bday"
                  required
                  min="1900-01-01"
                  aria-describedby="checkout-nacimiento-hint"
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                  className={inputClass}
                />
              </FormField>
            )}
          </div>
          {!isLoggedIn && (
            <p className="mt-3 px-2 text-sm text-muted">
              ¿Ya tienes cuenta?{" "}
              <Link href="/login?next=/checkout" className="font-semibold text-accent hover:underline">
                Inicia sesión
              </Link>{" "}
              para usar tus direcciones guardadas y ver este pedido en tu historial.
            </p>
          )}
        </section>

        {/* Dirección */}
        <section className="rounded-[28px] bg-white p-6 shadow-card">
          <SectionTitle step={2} title="Dirección de envío" />

          {direcciones.length > 0 && (
            <div className="mb-4 space-y-2" role="radiogroup" aria-label="Direcciones guardadas">
              {direcciones.map((d) => (
                <OptionCard
                  key={d.id}
                  checked={seleccion === d.id}
                  onSelect={() => setSeleccion(d.id)}
                  name="direccion"
                >
                  <p className="flex items-center gap-2 font-semibold">
                    {d.nombre_completo}
                    {d.predeterminada && (
                      <span className="rounded-pill border border-accent/20 px-2 py-0.5 text-[11px] font-semibold text-accent">
                        Predeterminada
                      </span>
                    )}
                  </p>
                  <p className="mt-0.5 text-sm text-muted">{formatDireccion(d)}</p>
                  <p className="text-sm text-muted">Tel. {d.telefono}</p>
                </OptionCard>
              ))}
              <OptionCard checked={seleccion === NUEVA} onSelect={() => setSeleccion(NUEVA)} name="direccion">
                <p className="font-semibold">Enviar a otra dirección</p>
              </OptionCard>
            </div>
          )}

          {seleccion === NUEVA && (
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <FormField id="checkout-nombre" label="Nombre de quien recibe">
                  <input
                    className={inputClass}
                    id="checkout-nombre"
                    autoComplete="name"
                    value={nueva.nombre_completo}
                    onChange={(e) => updateNueva("nombre_completo", e.target.value)}
                  />
                </FormField>
              </div>
              <div>
                <FormField id="checkout-telefono" label="Teléfono (10 dígitos)">
                  <input
                    className={inputClass}
                    id="checkout-telefono"
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    value={nueva.telefono}
                    onChange={(e) => updateNueva("telefono", e.target.value)}
                  />
                </FormField>
              </div>
              <div>
                <FormField id="checkout-cp" label="Código postal">
                  <input
                    className={inputClass}
                    id="checkout-cp"
                    inputMode="numeric"
                    maxLength={5}
                    autoComplete="postal-code"
                    value={nueva.codigo_postal}
                    onChange={(e) => updateNueva("codigo_postal", e.target.value.replace(/\D/g, ""))}
                  />
                </FormField>
              </div>
              <div className="sm:col-span-2">
                <FormField id="checkout-calle" label="Calle, número exterior e interior">
                  <input
                    className={inputClass}
                    id="checkout-calle"
                    autoComplete="street-address"
                    value={nueva.calle}
                    onChange={(e) => updateNueva("calle", e.target.value)}
                  />
                </FormField>
              </div>
              <div>
                <FormField id="checkout-colonia" label="Colonia">
                  <input
                    className={inputClass}
                    id="checkout-colonia"
                    value={nueva.colonia}
                    onChange={(e) => updateNueva("colonia", e.target.value)}
                  />
                </FormField>
              </div>
              <div>
                <FormField id="checkout-ciudad" label="Ciudad o alcaldía">
                  <input
                    className={inputClass}
                    id="checkout-ciudad"
                    autoComplete="address-level2"
                    value={nueva.ciudad}
                    onChange={(e) => updateNueva("ciudad", e.target.value)}
                  />
                </FormField>
              </div>
              <div className="sm:col-span-2">
                <FormField id="checkout-estado" label="Estado">
                  <select
                    id="checkout-estado"
                    className={`${inputClass} appearance-none ${nueva.estado ? "" : "text-muted"}`}
                    autoComplete="address-level1"
                    value={nueva.estado}
                    onChange={(e) => updateNueva("estado", e.target.value)}
                  >
                    <option value="" disabled>
                      Elige un estado
                    </option>
                    {ESTADOS_MX.map((estado) => (
                      <option key={estado} value={estado} className="text-black">
                        {estado}
                      </option>
                    ))}
                  </select>
                </FormField>
              </div>
              <div className="sm:col-span-2">
                <FormField id="checkout-referencias" label="Referencias para encontrar el domicilio (opcional)">
                  <input
                    className={inputClass}
                    id="checkout-referencias"
                    value={nueva.referencias ?? ""}
                    onChange={(e) => updateNueva("referencias", e.target.value)}
                  />
                </FormField>
              </div>
              {isLoggedIn && (
                <p className="px-2 text-xs text-muted sm:col-span-2">
                  Guardaremos esta dirección en tu cuenta para que tu próxima compra sea en 1 clic.
                </p>
              )}
            </div>
          )}
        </section>

        {/* Envío */}
        <section className="rounded-[28px] bg-white p-6 shadow-card">
          <SectionTitle step={3} title="Método de envío" />
          <div className="space-y-2" role="radiogroup" aria-label="Método de envío">
            <OptionCard checked={metodo === "nacional"} onSelect={() => setMetodo("nacional")} name="metodo_envio">
              <div className="flex items-start justify-between gap-3">
                <div className="flex gap-3">
                  <Truck size={20} className="mt-0.5 shrink-0 text-muted" />
                  <div>
                    <p className="font-semibold">{SHIPPING_METHODS.nacional.label}</p>
                    <p className="text-sm text-muted">{SHIPPING_METHODS.nacional.description}</p>
                  </div>
                </div>
                <ShippingPrice amount={calculateShippingCost(subtotal, "nacional")} />
              </div>
            </OptionCard>
            <OptionCard
              checked={metodo === "local"}
              onSelect={() => setMetodo("local")}
              disabled={!localDisponible}
              name="metodo_envio"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex gap-3">
                  <MapPin size={20} className="mt-0.5 shrink-0 text-muted" />
                  <div>
                    <p className="font-semibold">{SHIPPING_METHODS.local.label}</p>
                    <p className="text-sm text-muted">
                      {localDisponible
                        ? SHIPPING_METHODS.local.description
                        : "Disponible para direcciones en Ciudad de México y Estado de México."}
                    </p>
                  </div>
                </div>
                <ShippingPrice amount={0} />
              </div>
            </OptionCard>
          </div>
          {metodo === "nacional" && faltaParaGratis > 0 && (
            <p className="mt-3 rounded-[20px] bg-canvas px-4 py-3 text-xs text-black/60">
              Agrega {formatMXN(faltaParaGratis)} más y tu envío nacional es gratis.
            </p>
          )}
        </section>

        {/* Notas */}
        <section className="rounded-[28px] bg-white p-6 shadow-card">
          <SectionTitle step={4} title="Notas o instrucciones especiales para su pedido" />
          <label htmlFor="checkout-notas" className="sr-only">
            Notas o instrucciones especiales
          </label>
          <textarea
            id="checkout-notas"
            name="notas"
            rows={4}
            maxLength={MAX_NOTAS}
            placeholder="Ej. Dejar en recepción, tocar el timbre dos veces, es un regalo…"
            value={notas}
            onChange={(e) => setNotas(e.target.value)}
            className="w-full resize-none rounded-[20px] bg-canvas px-5 py-4 text-base outline-none transition-shadow placeholder:text-muted focus-visible:ring-2 focus-visible:ring-accent"
          />
          <p className="mt-1 px-2 text-right text-xs tabular-nums text-muted">
            {notas.length}/{MAX_NOTAS}
          </p>
        </section>
      </div>

      {/* Resumen */}
      <aside className="h-fit space-y-4 rounded-[28px] bg-white p-6 shadow-card lg:sticky lg:top-28">
        <h2 className="text-lg font-semibold tracking-tight">Resumen del pedido</h2>
        <ul className="max-h-72 space-y-2.5 overflow-y-auto scrollbar-none">
          {items.map(({ product, quantity }) => (
            <li key={product.id} className="flex justify-between gap-3 text-sm">
              <span className="min-w-0 text-black/70">
                <span className="font-semibold tabular-nums text-black">{quantity}×</span> {product.name}
              </span>
              <span className="shrink-0 tabular-nums">{formatMXN(product.sale_price * quantity)}</span>
            </li>
          ))}
        </ul>

        <PromoCodeField />

        <div className="space-y-2 border-t border-black/5 pt-4 text-sm">
          <div className="flex justify-between text-black/60">
            <span>Subtotal</span>
            <span className="tabular-nums">{formatMXN(subtotal)}</span>
          </div>
          {promo && <DiscountRow code={promo.code} amount={discount} />}
          <div className="flex justify-between text-black/60">
            <span>Envío {metodo === "local" ? "local" : "nacional"}</span>
            <span className="tabular-nums">{costoEnvio === 0 ? "Gratis" : formatMXN(costoEnvio)}</span>
          </div>
          <div className="flex justify-between pt-2 text-base font-semibold">
            <span>Total</span>
            <span className="tabular-nums">{formatMXN(total)}</span>
          </div>
        </div>

        <Turnstile onToken={setTurnstileToken} resetKey={turnstileReset} />

        {error && (
          <p role="alert" className="rounded-[20px] bg-red-50 px-4 py-3 text-sm text-danger">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={isPending}
          className="flex w-full items-center justify-center gap-2 rounded-full bg-accent py-3.5 font-semibold text-white shadow-accent transition-transform active:scale-[0.98] disabled:opacity-60"
        >
          {guardada && !isPending && <Zap size={16} fill="currentColor" />}
          {isPending ? "Confirmando…" : guardada ? "Comprar en 1 clic" : "Confirmar pedido"}
        </button>
        <p className="text-center text-xs text-muted">
          Te contactaremos para coordinar el pago. Muy pronto podrás pagar en línea con Mercado Pago.
        </p>
        <p className="text-center text-xs leading-relaxed text-muted">
          Al proceder con el pago, aceptas nuestros{" "}
          <Link href="/terminos" className="underline underline-offset-2 hover:text-ink">
            Términos y Condiciones
          </Link>{" "}
          y nuestro{" "}
          <Link href="/privacidad" className="underline underline-offset-2 hover:text-ink">
            Aviso de Privacidad
          </Link>
          . Venta operada por {LEGAL.razonSocial}
        </p>
        <HealthNotice className="text-center" />
        <PrivacyNotice className="text-center">
          Usamos tus datos para procesar y entregar tu pedido y verificar que eres mayor de edad.
        </PrivacyNotice>
      </aside>
    </form>
  );
}

function SectionTitle({ step, title }: { step: number; title: string }) {
  return (
    <h2 className="mb-4 flex items-center gap-3 text-lg font-semibold tracking-tight">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-pill bg-canvas text-sm tabular-nums text-black/60">
        {step}
      </span>
      {title}
    </h2>
  );
}

function ShippingPrice({ amount }: { amount: number }) {
  return (
    <span className={`shrink-0 font-semibold tabular-nums ${amount === 0 ? "text-accent" : ""}`}>
      {amount === 0 ? "Gratis" : formatMXN(amount)}
    </span>
  );
}

function OptionCard({
  checked,
  onSelect,
  disabled = false,
  name,
  children,
}: {
  checked: boolean;
  onSelect: () => void;
  disabled?: boolean;
  name: string;
  children: React.ReactNode;
}) {
  return (
    <label
      className={`flex gap-3 rounded-[20px] border p-4 transition-colors ${
        disabled
          ? "cursor-not-allowed border-black/5 opacity-50"
          : checked
            ? "cursor-pointer border-accent/40 bg-accent/[0.03]"
            : "cursor-pointer border-black/10 hover:border-black/20"
      }`}
    >
      <input type="radio" name={name} checked={checked} disabled={disabled} onChange={onSelect} className="sr-only" />
      <span
        aria-hidden
        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-pill border-2 transition-colors ${
          checked ? "border-accent bg-accent text-white" : "border-black/20"
        }`}
      >
        {checked && <Check size={12} strokeWidth={3.5} />}
      </span>
      <div className="min-w-0 flex-1">{children}</div>
    </label>
  );
}
