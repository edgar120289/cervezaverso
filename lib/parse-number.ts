/** Convierte el texto de un campo numérico; vacío → NaN para que la validación lo marque. */
export function parseFieldNumber(value: string): number {
  return value.trim() === "" ? NaN : Number(value);
}
