/** Sólo rutas internas ("/cuenta"), nunca "//otro-sitio.com" ni URLs absolutas: evita open redirects. */
export function safeNextPath(value: string | null | undefined, fallback = "/cuenta"): string {
  return value && value.startsWith("/") && !value.startsWith("//") && !value.startsWith("/\\") ? value : fallback;
}
