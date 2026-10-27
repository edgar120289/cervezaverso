/**
 * Zona de envío por código postal.
 *
 * BORRADOR SUJETO A REVISIÓN: los rangos de municipios conurbados están pendientes de que el cliente
 * los apruebe y se verifiquen contra el catálogo de SEPOMEX. Editar solo esta lista basta para
 * cambiar la cobertura de «CDMX y zona metropolitana».
 */
export type ShippingZone = "metro" | "nacional";

type CpRange = readonly [from: number, to: number];

/** Las 16 alcaldías de la Ciudad de México: CP 01000 a 16999. */
const CDMX_RANGE: CpRange = [1000, 16999];

type Municipio = { nombre: string; estado: "Estado de México" | "Hidalgo"; rangos: readonly CpRange[] };

export const MUNICIPIOS_CONURBADOS: readonly Municipio[] = [
  { nombre: "Naucalpan de Juárez", estado: "Estado de México", rangos: [[53000, 53999]] },
  { nombre: "Tlalnepantla de Baz", estado: "Estado de México", rangos: [[54000, 54199]] },
  { nombre: "Atizapán de Zaragoza", estado: "Estado de México", rangos: [[52900, 52999]] },
  { nombre: "Huixquilucan", estado: "Estado de México", rangos: [[52700, 52799]] },
  { nombre: "Cuautitlán Izcalli", estado: "Estado de México", rangos: [[54700, 54799]] },
  { nombre: "Cuautitlán", estado: "Estado de México", rangos: [[54800, 54899]] },
  { nombre: "Tultitlán", estado: "Estado de México", rangos: [[54900, 54999]] },
  { nombre: "Coacalco de Berriozábal", estado: "Estado de México", rangos: [[55700, 55729]] },
  { nombre: "Ecatepec de Morelos", estado: "Estado de México", rangos: [[55000, 55499]] },
  { nombre: "Tecámac", estado: "Estado de México", rangos: [[55740, 55799]] },
  { nombre: "Nezahualcóyotl", estado: "Estado de México", rangos: [[57000, 57999]] },
  { nombre: "Chimalhuacán", estado: "Estado de México", rangos: [[56330, 56399]] },
  { nombre: "La Paz", estado: "Estado de México", rangos: [[56400, 56499]] },
  { nombre: "Ixtapaluca", estado: "Estado de México", rangos: [[56530, 56599]] },
  { nombre: "Chalco y Valle de Chalco", estado: "Estado de México", rangos: [[56600, 56649]] },
  { nombre: "Tizayuca", estado: "Hidalgo", rangos: [[43800, 43899]] },
];

function inRange(cp: number, [from, to]: CpRange): boolean {
  return cp >= from && cp <= to;
}

/** `metro` = CDMX y zona metropolitana; `nacional` = resto del país (o dirección incompleta). */
export function getShippingZone(address: { estado: string; codigo_postal: string } | null | undefined): ShippingZone {
  if (!address) return "nacional";
  const cp = Number(address.codigo_postal);
  if (!Number.isInteger(cp)) return "nacional";
  if (address.estado === "Ciudad de México" || inRange(cp, CDMX_RANGE)) return "metro";
  const conurbado = MUNICIPIOS_CONURBADOS.some(
    (m) => m.estado === address.estado && m.rangos.some((range) => inRange(cp, range)),
  );
  return conurbado ? "metro" : "nacional";
}
