"use client";

import { useEffect, useRef, useState, useTransition, type FormEvent } from "react";
import Link from "next/link";
import { LEGAL } from "@/lib/site";
import { Check, ChevronDown, CreditCard, Landmark, Truck, Zap } from "lucide-react";
import { useCart } from "@/lib/cart-context";
import { useAccount } from "@/lib/account-context";
import { useMediaQuery } from "@/lib/use-media-query";
import { shippingHint } from "@/lib/cart-progress";
import { clearCheckoutDraft, readCheckoutDraft, saveCheckoutDraft } from "@/lib/checkout-draft";
import {
  calculateOrderTotals,
  promoBase,
  calculateShippingCost,
  formatMXN,
  PAYMENT_METHODS,
  SHIPPING_METHODS,
  type PaymentMethod,
} from "@/lib/pricing";
import { ESTADOS_MX } from "@/lib/estados-mx";
import { estadoDeCodigoPostal } from "@/lib/postal-estados";
import { getShippingZone } from "@/lib/shipping-zones";
import { checkoutSchema, firstIssue, isHoneypotFilled, MAX_NOTAS } from "@/lib/validation";
import PromoCodeField, { DiscountRow } from "@/components/PromoCodeField";
import { VolumeDiscountNotice, VolumeDiscountRow } from "@/components/VolumeDiscount";
import Honeypot from "@/components/Honeypot";
import Turnstile, { TURNSTILE_ENABLED } from "@/components/Turnstile";
import FormField from "@/components/FormField";
import BankTransferCard from "@/components/BankTransferCard";
import HealthNotice from "@/components/HealthNotice";
import PrivacyNotice from "@/components/PrivacyNotice";
import CartLines from "@/components/cart/CartLines";
import EmptyCart from "@/components/cart/EmptyCart";
import LinkedOrdersNotice from "@/components/LinkedOrdersNotice";
import { GoogleSignInButton } from "@/components/SocialLoginButtons";
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
  const { items, subtotal, isHydrated, promo, removePromo, refresh, lineStatus, lastRemoved } = useCart();
  const { displayName, signOut } = useAccount();
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const [isPending, startTransition] = useTransition();
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [summaryOpen, setSummaryOpen] = useState(false);
  const errorRef = useRef<HTMLParagraphElement>(null);

  // Al volver con "atrás" desde Mercado Pago el navegador restaura esta página tal cual.
  useEffect(() => {
    const reset = (event: PageTransitionEvent) => {
      if (event.persisted) setIsRedirecting(false);
    };
    window.addEventListener("pageshow", reset);
    return () => window.removeEventListener("pageshow", reset);
  }, []);
  const [error, setError] = useState<string | null>(null);
  const [metodoPago, setMetodoPago] = useState<PaymentMethod>("mercadopago");

  const predeterminada = direcciones.find((d) => d.predeterminada) ?? direcciones[0];
  // Con sesión se usa el correo de la cuenta; como invitado, el que escribió.
  const [email, setEmail] = useState(initialEmail);
  // Las direcciones guardadas mandan; lo ya escrito queda en «Enviar a otra dirección».
  const [seleccion, setSeleccion] = useState<string>(predeterminada?.id ?? NUEVA);
  const [nueva, setNueva] = useState<DireccionEnvio>(EMPTY_DIRECCION);
  const [notas, setNotas] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [draftReady, setDraftReady] = useState(false);
  const [honeypot, setHoneypot] = useState("");
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [turnstileReset, setTurnstileReset] = useState(0);

  const guardada = direcciones.find((d) => d.id === seleccion);
  const direccion: DireccionEnvio = guardada ?? nueva;
  // Sin código postal completo no se supone ninguna zona; el servidor siempre recalcula con la dirección real.
  const zona = /^\d{5}$/.test(direccion.codigo_postal) ? getShippingZone(direccion) : null;
  const base = promoBase(items.map((item) => ({ country: item.product.country, amount: item.product.sale_price * item.quantity })), promo);
  const totales = calculateOrderTotals(subtotal, promo, zona ?? "nacional", base);
  const { discount, volumeDiscount } = totales;
  const costoEnvio = zona ? totales.shippingCost : null;
  const total = zona ? totales.total : totales.total - totales.shippingCost;
  const piezas = items.reduce((sum, item) => sum + item.quantity, 0);
  const hayAgotadas = items.some((item) => lineStatus(item.product.id) === "unavailable");

  // Precios y existencias al día al entrar: lo que se ve es lo que se cobra.
  useEffect(() => {
    if (isHydrated) refresh(true);
  }, [isHydrated, refresh]);

  // Lo escrito antes de salir a iniciar sesión (o de recargar) vuelve tal cual. Se lee al montar
  // (no al renderizar) para que el HTML del servidor coincida y el formulario se vea de inmediato.
  useEffect(() => {
    const draft = readCheckoutDraft();
    /* eslint-disable react-hooks/set-state-in-effect -- sessionStorage solo existe en el navegador */
    if (draft) {
      setMetodoPago(draft.metodoPago);
      if (!initialEmail && draft.email) setEmail(draft.email);
      setNueva((prev) => ({ ...prev, ...draft.nueva }));
      setNotas(draft.notas);
      setBirthDate(draft.birthDate);
    }
    setDraftReady(true);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [initialEmail]);

  // Guarda el borrador mientras escribe (solo esta pestaña; se borra al ir a pagar).
  useEffect(() => {
    if (!draftReady || isRedirecting) return;
    saveCheckoutDraft({ email: isLoggedIn ? "" : email, birthDate, notas, metodoPago, nueva });
  }, [draftReady, isRedirecting, isLoggedIn, email, birthDate, notas, metodoPago, nueva]);

  // El error siempre a la vista (en celular el botón vive en la barra inferior).
  useEffect(() => {
    if (error) errorRef.current?.scrollIntoView({ block: "center" });
  }, [error]);

  if (isRedirecting) {
    return <div className="h-96 animate-pulse rounded-[28px] bg-white shadow-card" />;
  }

  if (isHydrated && items.length === 0) {
    return (
      <div className="mx-auto max-w-lg space-y-4">
        {lastRemoved && (
          <div className="rounded-[28px] bg-white px-4 shadow-card">
            <CartLines variant="compact" />
          </div>
        )}
        <div className="rounded-[28px] bg-white shadow-card">
          <EmptyCart />
        </div>
      </div>
    );
  }

  function updateNueva(campo: keyof DireccionEnvio, value: string) {
    setNueva((prev) => ({ ...prev, [campo]: value }));
  }

  /** Con 5 dígitos, el estado se rellena según el CP si está vacío o no coincide; el cliente puede cambiarlo después. */
  function updateCodigoPostal(value: string) {
    const codigo = value.replace(/\D/g, "");
    setNueva((prev) => {
      const sugerido = estadoDeCodigoPostal(codigo);
      return { ...prev, codigo_postal: codigo, estado: sugerido && prev.estado !== sugerido ? sugerido : prev.estado };
    });
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (isHoneypotFilled(honeypot)) return;
    if (hayAgotadas) {
      setError("Una cerveza de tu pedido se agotó. Quítala del resumen para continuar.");
      return;
    }

    const input = {
      email,
      metodo_envio: "nacional",
      metodo_pago: metodoPago,
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
      let result: { initPoint?: string; redirectUrl?: string; error?: string; promoInvalid?: boolean } = {};
      try {
        const response = await fetch("/api/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(input),
        });
        result = await response.json();
      } catch {
        result = { error: "No pudimos conectar con el servidor. Revisa tu conexión e intenta de nuevo." };
      }
      // Cada token de Turnstile sirve una sola vez.
      setTurnstileReset((n) => n + 1);
      const destino = result.initPoint ?? result.redirectUrl;
      if (!destino) {
        // El código dejó de servir (se agotó o lo desactivaron): se quita y los totales se recalculan.
        if (result.promoInvalid) removePromo();
        const mensaje = result.error ?? "No pudimos iniciar el pago. Intenta de nuevo.";
        setError(result.promoInvalid ? `${mensaje} Lo quitamos de tu pedido; revisa el total.` : mensaje);
        // Pudo cambiar un precio o agotarse algo: se actualiza el resumen.
        refresh(true);
        return;
      }
      // El carrito se vacía al volver del pago (página del pedido); si el cliente cancela, lo conserva.
      setIsRedirecting(true);
      clearCheckoutDraft();
      window.location.assign(destino);
    });
  }

  const submitButton = (
    <button
      type="submit"
      disabled={isPending}
      className="flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-accent px-4 py-3 font-semibold text-white shadow-accent transition-transform active:scale-[0.98] disabled:opacity-60"
    >
      {guardada && !isPending && metodoPago === "mercadopago" && <Zap size={16} fill="currentColor" aria-hidden />}
      {isPending
        ? "Preparando tu pedido…"
        : metodoPago === "transferencia"
          ? "Confirmar pedido"
          : guardada
            ? "Pagar en 1 clic"
            : "Pagar con Mercado Pago"}
    </button>
  );

  // Resumen editable y compacto: sin barras grandes ni sugerencias (eso vive en el carrito).
  const summary = !isHydrated ? (
    <div aria-hidden className="h-48 animate-pulse rounded-[20px] bg-canvas" />
  ) : (
    <>
      <CartLines variant="compact" />
      <p className="rounded-[16px] bg-canvas px-4 py-2 text-sm text-black/70">{shippingHint(subtotal, zona)}</p>
      <PromoCodeField />
      {discount > 0 && <VolumeDiscountNotice />}
      <div className="space-y-2 border-t border-black/5 pt-4 text-sm">
        <div className="flex justify-between text-black/60">
          <span>Subtotal</span>
          <span className="tabular-nums">{formatMXN(subtotal)}</span>
        </div>
        {promo && <DiscountRow code={promo.code} amount={discount} />}
        <VolumeDiscountRow amount={volumeDiscount} />
        <div className="flex justify-between gap-3 text-black/60">
          <span>Envío</span>
          <span className="text-right tabular-nums">
            {costoEnvio === null ? "Se calcula con tu código postal" : costoEnvio === 0 ? "Gratis" : formatMXN(costoEnvio)}
          </span>
        </div>
        <div className="flex justify-between pt-2 text-base font-semibold">
          <span>{costoEnvio === null ? "Total sin envío" : "Total"}</span>
          <span className="tabular-nums">{formatMXN(total)}</span>
        </div>
      </div>
    </>
  );

  // Una sola instancia de Turnstile: en el resumen (PC) o al final del formulario (celular).
  const payBlock = (
    <>
      <Turnstile onToken={setTurnstileToken} resetKey={turnstileReset} />
      {error && (
        <p ref={errorRef} role="alert" className="rounded-[20px] bg-red-50 px-4 py-3 text-sm text-danger">
          {error}
        </p>
      )}
      {isDesktop && submitButton}
      <p className="text-center text-xs text-muted">
        {metodoPago === "transferencia"
          ? "Al confirmar, verás tu número de pedido y podrás enviarnos el comprobante por WhatsApp. Preparamos tu envío al confirmar el depósito."
          : "Pagas en la página segura de Mercado Pago con tarjeta, SPEI u OXXO Pay. Nosotros nunca vemos tus datos de pago."}
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
    </>
  );

  return (
    <form onSubmit={handleSubmit} noValidate className="relative grid grid-cols-[minmax(0,1fr)] gap-6 pb-28 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start lg:pb-0">
      <Honeypot value={honeypot} onChange={setHoneypot} />
      <div className="space-y-4">
        {/* Celular: resumen plegable arriba (cerrado). Visibilidad por CSS para que nada brinque al cargar. */}
        <div className="lg:hidden">
          <MobileSummary
            open={summaryOpen}
            onToggle={() => setSummaryOpen((v) => !v)}
            piezas={isHydrated ? piezas : null}
            total={isHydrated ? total : null}
          >
            {summaryOpen && summary}
          </MobileSummary>
        </div>

        {/* Contacto */}
        <section className="rounded-[28px] bg-white p-6 shadow-card">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-x-4">
            <SectionTitle step={1} title="Contacto" inline />
            {!isLoggedIn && (
              <p className="text-sm text-muted">
                ¿Ya tienes cuenta?{" "}
                <Link href="/login?next=/checkout" className="inline-flex min-h-11 items-center font-semibold text-accent hover:underline">
                  Inicia sesión
                </Link>
              </p>
            )}
          </div>

          <LinkedOrdersNotice className="mb-3" />

          {isLoggedIn ? (
            <p className="flex flex-wrap items-center gap-x-2 rounded-[20px] bg-canvas px-4 py-0.5 text-sm">
              <span className="text-black/70">
                Comprando como <span className="font-semibold text-black">{displayName}</span>
              </span>
              <span aria-hidden className="text-black/30">
                ·
              </span>
              <span className="min-w-0 break-all text-black/70">{email}</span>
              <span aria-hidden className="text-black/30">
                ·
              </span>
              <button
                type="button"
                onClick={() => void signOut("/checkout")}
                className="inline-flex min-h-11 items-center font-semibold text-accent hover:underline"
              >
                Cambiar
              </button>
            </p>
          ) : (
            <div className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-1 rounded-[20px] bg-accent/[0.06] px-4 py-2">
              <p className="mr-auto text-sm font-semibold text-black/80">Suma botellas a tus premios</p>
              <GoogleSignInButton next="/checkout" />
              <Link
                href="/login?next=/checkout"
                className="inline-flex min-h-11 items-center px-1 text-sm font-semibold text-accent hover:underline"
              >
                Entrar con correo
              </Link>
            </div>
          )}

          {(!isLoggedIn || requiresBirthDate) && (
            <div className={`space-y-3 ${isLoggedIn ? "mt-3" : ""}`}>
              {!isLoggedIn && (
                <FormField
                  id="checkout-email"
                  label="Correo electrónico"
                  hint="Como invitado tus botellas no se suman (si después creas tu cuenta con el mismo correo, las recuperamos)."
                >
                  <input
                    id="checkout-email"
                    type="email"
                    name="email"
                    autoComplete="email"
                    required
                    aria-describedby="checkout-email-hint"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={inputClass}
                  />
                </FormField>
              )}
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
                    onChange={(e) => updateCodigoPostal(e.target.value)}
                  />
                </FormField>
              </div>
              <div className="sm:col-span-2">
                <FormField id="checkout-calle" label="Calle, número exterior e interior">
                  <input
                    className={inputClass}
                    id="checkout-calle"
                    autoComplete="address-line1"
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
                    autoComplete="address-line2"
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
            <OptionCard checked onSelect={() => undefined} name="metodo_envio">
              <div className="flex items-start justify-between gap-3">
                <div className="flex gap-3">
                  <Truck size={20} className="mt-0.5 shrink-0 text-muted" />
                  <div>
                    <p className="font-semibold">{SHIPPING_METHODS.nacional.label}</p>
                    <p className="text-sm text-muted">{SHIPPING_METHODS.nacional.description}</p>
                  </div>
                </div>
                <ShippingPrice amount={zona ? calculateShippingCost(subtotal, zona) : null} />
              </div>
            </OptionCard>
          </div>
        </section>

        {/* Pago */}
        <section className="rounded-[28px] bg-white p-6 shadow-card">
          <SectionTitle step={4} title="Método de pago" />
          <div className="space-y-2" role="radiogroup" aria-label="Método de pago">
            <OptionCard checked={metodoPago === "mercadopago"} onSelect={() => setMetodoPago("mercadopago")} name="metodo_pago">
              <div className="flex gap-3">
                <CreditCard size={20} className="mt-0.5 shrink-0 text-muted" />
                <div>
                  <p className="font-semibold">{PAYMENT_METHODS.mercadopago.label}</p>
                  <p className="text-sm text-muted">{PAYMENT_METHODS.mercadopago.description}</p>
                  <p className="mt-1 text-sm text-muted">{PAYMENT_METHODS.mercadopago.delivery}</p>
                </div>
              </div>
            </OptionCard>
            <OptionCard checked={metodoPago === "transferencia"} onSelect={() => setMetodoPago("transferencia")} name="metodo_pago">
              <div className="flex gap-3">
                <Landmark size={20} className="mt-0.5 shrink-0 text-muted" />
                <div>
                  <p className="font-semibold">{PAYMENT_METHODS.transferencia.label}</p>
                  <p className="text-sm text-muted">{PAYMENT_METHODS.transferencia.description}</p>
                  <p className="mt-1 inline-block rounded-pill bg-accent/10 px-3 py-1 text-sm font-semibold text-accent">
                    {PAYMENT_METHODS.transferencia.delivery}
                  </p>
                </div>
              </div>
            </OptionCard>
          </div>
          {metodoPago === "transferencia" && <BankTransferCard />}
        </section>

        {/* Notas */}
        <section className="rounded-[28px] bg-white p-6 shadow-card">
          <SectionTitle step={5} title="Notas o instrucciones especiales para su pedido" />
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

        <section className="space-y-4 rounded-[28px] bg-white p-6 shadow-card lg:hidden">{!isDesktop && payBlock}</section>

        <div className="space-y-2 px-2">
          <HealthNotice className="text-center" />
          <PrivacyNotice className="text-center">
            Usamos tus datos para procesar y entregar tu pedido y verificar que eres mayor de edad.
          </PrivacyNotice>
        </div>
      </div>

      {/* PC: fijo a la vista; el resumen se desplaza por dentro y el botón de pago siempre se ve. */}
      <aside className="sticky top-28 hidden max-h-[calc(100dvh-8rem)] flex-col rounded-[28px] bg-white shadow-card lg:flex">
        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain p-6 pb-4">
          <h2 className="text-lg font-semibold tracking-tight">Resumen del pedido</h2>
          {isDesktop ? summary : <div aria-hidden className="h-48 rounded-[20px] bg-canvas" />}
        </div>
        <div className="shrink-0 space-y-3 border-t border-black/5 p-6 pt-4">{isDesktop ? payBlock : submitButton}</div>
      </aside>

      {/* Celular: barra fija con el total y el botón; el pago siempre a la mano con una sola mano. */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-black/5 bg-white px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 shadow-[0_-8px_24px_rgba(0,0,0,0.06)] lg:hidden">
        <div className="mx-auto flex max-w-lg items-center gap-3">
          <div className="w-24 shrink-0">
            <p className="text-xs text-muted">{costoEnvio === null ? "Total sin envío" : "Total"}</p>
            <p className="text-lg font-semibold leading-tight tabular-nums">{isHydrated ? formatMXN(total) : "\u00a0"}</p>
          </div>
          <div className="min-w-0 flex-1">{submitButton}</div>
        </div>
      </div>
    </form>
  );
}

function MobileSummary({
  open,
  onToggle,
  piezas,
  total,
  children,
}: {
  open: boolean;
  onToggle: () => void;
  /** null mientras se lee el carrito del navegador. */
  piezas: number | null;
  total: number | null;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[28px] bg-white shadow-card">
      <h2>
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={open}
          aria-controls="checkout-mobile-summary"
          className="flex min-h-14 w-full items-center justify-between gap-3 px-5 text-left"
        >
          <span className="text-base font-semibold">
            Ver y editar pedido{piezas !== null && ` (${piezas} ${piezas === 1 ? "pieza" : "piezas"})`}
          </span>
          <span className="flex shrink-0 items-center gap-2 font-semibold tabular-nums">
            {total !== null && formatMXN(total)}
            <ChevronDown
              size={18}
              aria-hidden
              className={`transition-transform motion-reduce:transition-none ${open ? "rotate-180" : ""}`}
            />
          </span>
        </button>
      </h2>
      <div id="checkout-mobile-summary" hidden={!open} className="space-y-4 px-5 pb-5">
        {children}
      </div>
    </section>
  );
}

function SectionTitle({ step, title, inline = false }: { step: number; title: string; inline?: boolean }) {
  return (
    <h2 className={`flex items-center gap-3 text-lg font-semibold tracking-tight ${inline ? "" : "mb-4"}`}>
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-pill bg-canvas text-sm tabular-nums text-black/60">
        {step}
      </span>
      {title}
    </h2>
  );
}

function ShippingPrice({ amount }: { amount: number | null }) {
  if (amount === null) return <span className="w-28 shrink-0 text-right text-sm text-muted">Se calcula con tu código postal</span>;
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
