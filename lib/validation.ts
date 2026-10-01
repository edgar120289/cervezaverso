import { z } from "zod";
import { ESTADOS_MX } from "@/lib/estados-mx";
import { isLocalShippingState } from "@/lib/pricing";

/**
 * Validación y anti-spam compartidos (MASTER PROMPT V2 · Bloque 4.3).
 *
 * Honeypot: cada formulario incluye un campo oculto (`HONEYPOT_FIELD`) que una
 * persona nunca ve ni llena. Si llega con contenido, lo envió un bot y el envío
 * se descarta en silencio.
 */
export const HONEYPOT_FIELD = "website";

export function isHoneypotFilled(value: unknown): boolean {
  return typeof value === "string" && value.trim().length > 0;
}

export const credentialsSchema = z.object({
  email: z.email("Escribe un correo electrónico válido.").trim().toLowerCase(),
  password: z
    .string()
    .min(6, "La contraseña debe tener al menos 6 caracteres.")
    .max(72, "La contraseña no puede tener más de 72 caracteres."),
});

export type Credentials = z.infer<typeof credentialsSchema>;

export const MIN_AGE = 18;

/** ¿La fecha (AAAA-MM-DD) es de alguien con 18 años cumplidos a la fecha de `today`? */
export function isAdult(birthDate: string, today: Date = new Date()): boolean {
  const [year, month, day] = birthDate.split("-").map(Number);
  const limit = new Date(Date.UTC(today.getUTCFullYear() - MIN_AGE, today.getUTCMonth(), today.getUTCDate()));
  return Date.UTC(year, month - 1, day) <= limit.getTime();
}

/** Fecha de nacimiento de un input `type="date"`: real, desde 1900 y de mayor de edad. */
export const birthDateSchema = z
  .string("Escribe tu fecha de nacimiento.")
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Escribe tu fecha de nacimiento.")
  .refine((value) => {
    const date = new Date(`${value}T00:00:00Z`);
    return !Number.isNaN(date.getTime()) && date.toISOString().startsWith(value) && value >= "1900-01-01";
  }, "Escribe una fecha de nacimiento válida.")
  .refine((value) => isAdult(value), `La venta es exclusiva para mayores de ${MIN_AGE} años.`);

/** Campos anti-spam que viajan con cada formulario público. */
const antiSpamFields = {
  [HONEYPOT_FIELD]: z.string().optional(),
  turnstileToken: z.string().max(2048).nullish(),
};

export const loginSchema = credentialsSchema.extend(antiSpamFields);

export const signupSchema = credentialsSchema.extend({
  ...antiSpamFields,
  fecha_nacimiento: birthDateSchema,
  next: z.string().max(300).optional(),
});

export const recoverSchema = z.object({
  ...antiSpamFields,
  email: z.email("Escribe un correo electrónico válido.").trim().toLowerCase(),
});

const trimmed = (max: number, message: string) => z.string().trim().min(1, message).max(max);

export const direccionSchema = z.object({
  nombre_completo: trimmed(120, "Escribe el nombre de quien recibe."),
  telefono: z
    .string()
    .trim()
    .transform((value) => value.replace(/[^\d+]/g, ""))
    .pipe(z.string().regex(/^\+?\d{10,13}$/, "Escribe un teléfono de 10 dígitos.")),
  calle: trimmed(160, "Escribe la calle y el número."),
  colonia: trimmed(120, "Escribe la colonia."),
  ciudad: trimmed(120, "Escribe la ciudad o alcaldía."),
  estado: z.enum(ESTADOS_MX, "Elige un estado."),
  codigo_postal: z.string().trim().regex(/^\d{5}$/, "El código postal debe tener 5 dígitos."),
  referencias: z
    .string()
    .trim()
    .max(300)
    .optional()
    .transform((value) => value || null),
});

/** Códigos de promoción: se guardan en mayúsculas (A-Z, 0-9, guion y guion bajo). */
export const promoCodeSchema = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^[A-Z0-9_-]{3,30}$/, "El código debe tener de 3 a 30 letras, números o guiones.");

export const MAX_NOTAS = 500;

export const checkoutSchema = z
  .object({
    email: z.email("Escribe un correo electrónico válido.").trim().toLowerCase(),
    metodo_envio: z.enum(["nacional", "local"], "Elige un método de envío."),
    direccion: direccionSchema,
    notas: z
      .string()
      .trim()
      .max(MAX_NOTAS, `Las notas no pueden pasar de ${MAX_NOTAS} caracteres.`)
      .optional()
      .transform((value) => value || null),
    items: z
      .array(
        z.object({
          product_id: z.uuid(),
          cantidad: z.number().int().min(1).max(99),
        })
      )
      .min(1, "Tu carrito está vacío.")
      .max(100),
    promo_code: promoCodeSchema.nullish().transform((value) => value || null),
    /** Obligatoria salvo que la cuenta ya tenga una registrada (lo decide el servidor). */
    fecha_nacimiento: birthDateSchema.nullish().transform((value) => value || null),
    ...antiSpamFields,
  })
  .refine(
    (data) => data.metodo_envio !== "local" || isLocalShippingState(data.direccion.estado),
    {
      path: ["metodo_envio"],
      message: "El envío local sólo aplica en CDMX y Estado de México (Área Metropolitana).",
    }
  );

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .nullish()
    .transform((value) => value || null);

/** Edición de producto desde el panel. `sale_price` no viene aquí: lo calcula el servidor. */
export const productUpdateSchema = z.object({
  id: z.uuid(),
  name: trimmed(160, "Escribe el nombre de la cerveza."),
  brewery: optionalText(160),
  country: trimmed(80, "Escribe el país."),
  style: trimmed(120, "Escribe el estilo."),
  abv: z.number("El ABV debe ser un número.").min(0, "El ABV no puede ser negativo.").max(99.99),
  volume_ml: z.number("El volumen debe ser un número.").int("El volumen debe ser entero.").min(0).max(100000),
  cost_price: z.number("El costo debe ser un número.").min(0, "El costo no puede ser negativo.").max(99999999),
  margin_pct: z.number("El margen debe ser un número.").min(0, "El margen no puede ser negativo.").max(500, "El margen máximo es 500%."),
  stock_status: z.enum(["in_stock", "low_stock", "out_of_stock", "preorder"], "Elige una disponibilidad."),
  badges: z.array(z.string().trim().min(1).max(40)).max(10),
  description_ai: optionalText(4000),
  pairing_ai: optionalText(4000),
  notas_origen: optionalText(4000),
  notas_perfil: optionalText(4000),
  notas_maridaje: optionalText(4000),
});

/** Alta manual desde el panel. `sku` y `sale_price` los calcula el servidor. */
export const productCreateSchema = productUpdateSchema
  .pick({ name: true, brewery: true, country: true, style: true, abv: true, volume_ml: true, cost_price: true, margin_pct: true, stock_status: true })
  .extend({ margin_pct: productUpdateSchema.shape.margin_pct.default(50) });

export type ProductCreate = z.input<typeof productCreateSchema>;

export type ProductUpdate = z.input<typeof productUpdateSchema>;

export const PRODUCT_IMAGE_BUCKET = "product-images";
export const MAX_PRODUCT_IMAGE_BYTES = 5 * 1024 * 1024;
export const PRODUCT_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"];

export const productImageSchema = z
  .instanceof(File, { message: "No se eligió ninguna imagen." })
  .refine((file) => PRODUCT_IMAGE_TYPES.includes(file.type), "La imagen debe ser JPG, PNG, WebP o AVIF.")
  .refine((file) => file.size > 0, "La imagen está vacía.")
  .refine((file) => file.size <= MAX_PRODUCT_IMAGE_BYTES, "La imagen supera los 5 MB.");

export const promoCreateSchema = z
  .object({
    code: promoCodeSchema,
    discount_type: z.enum(["percent", "fixed"], "Elige el tipo de descuento."),
    value: z.number("Escribe el valor del descuento.").positive("El valor debe ser mayor a 0.").max(1000000),
    min_purchase: z.number("La compra mínima debe ser un número.").min(0).max(1000000),
    max_uses: z.number().int("Los usos deben ser un número entero.").positive("Los usos deben ser 1 o más.").nullable(),
  })
  .refine((data) => data.discount_type !== "percent" || data.value <= 100, {
    path: ["value"],
    message: "Un porcentaje no puede pasar de 100%.",
  });

export type PromoCreate = z.input<typeof promoCreateSchema>;

const MAX_EXCEL_BYTES = 10 * 1024 * 1024;

export const catalogUploadSchema = z.object({
  file: z
    .instanceof(File, { message: "No se recibió ningún archivo." })
    .refine((file) => /\.(xlsx|csv)$/i.test(file.name), "El archivo debe ser .xlsx o .csv.")
    .refine((file) => file.size > 0, "El archivo está vacío.")
    .refine((file) => file.size <= MAX_EXCEL_BYTES, "El archivo supera los 10 MB."),
});

/** Primer mensaje de error legible de un resultado de Zod. */
export function firstIssue(error: z.ZodError): string {
  return error.issues[0]?.message ?? "Datos inválidos.";
}
