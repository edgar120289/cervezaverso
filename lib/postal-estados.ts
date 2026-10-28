import type { ESTADOS_MX } from "@/lib/estados-mx";

type Estado = (typeof ESTADOS_MX)[number];

/**
 * Dos primeros dígitos del código postal de cada estado (rangos inclusivos, p. ej. [1, 16] = 01 a 16).
 * Cotejado (2026-10-28) con la asignación de SEPOMEX por entidad: coincide en los 32 estados; 00 y 17–19 no se usan.
 * El tipo `Record` obliga a que cada entrada de `ESTADOS_MX` tenga su fila.
 */
const PREFIJOS_POR_ESTADO: Record<Estado, readonly (readonly [from: number, to: number])[]> = {
  "Ciudad de México": [[1, 16]],
  Aguascalientes: [[20, 20]],
  "Baja California": [[21, 22]],
  "Baja California Sur": [[23, 23]],
  Campeche: [[24, 24]],
  Coahuila: [[25, 27]],
  Colima: [[28, 28]],
  Chiapas: [[29, 30]],
  Chihuahua: [[31, 33]],
  Durango: [[34, 35]],
  Guanajuato: [[36, 38]],
  Guerrero: [[39, 41]],
  Hidalgo: [[42, 43]],
  Jalisco: [[44, 49]],
  "Estado de México": [[50, 57]],
  Michoacán: [[58, 61]],
  Morelos: [[62, 62]],
  Nayarit: [[63, 63]],
  "Nuevo León": [[64, 67]],
  Oaxaca: [[68, 71]],
  Puebla: [[72, 75]],
  Querétaro: [[76, 76]],
  "Quintana Roo": [[77, 77]],
  "San Luis Potosí": [[78, 79]],
  Sinaloa: [[80, 82]],
  Sonora: [[83, 85]],
  Tabasco: [[86, 86]],
  Tamaulipas: [[87, 89]],
  Tlaxcala: [[90, 90]],
  Veracruz: [[91, 96]],
  Yucatán: [[97, 97]],
  Zacatecas: [[98, 99]],
};

/** `true` si el CP de 5 dígitos pertenece al estado indicado. */
export function codigoPostalCorrespondeAEstado(codigoPostal: string, estado: Estado): boolean {
  if (!/^\d{5}$/.test(codigoPostal)) return false;
  const prefijo = Number(codigoPostal.slice(0, 2));
  return PREFIJOS_POR_ESTADO[estado].some(([from, to]) => prefijo >= from && prefijo <= to);
}
