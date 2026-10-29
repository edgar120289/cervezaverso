/**
 * Pruebas de la zona de envío por código postal y de la coherencia CP ↔ estado (sin base de datos).
 * Uso: npx tsx scripts/test-shipping-zones.ts
 */
import assert from "node:assert/strict";
import { ESTADOS_MX } from "@/lib/estados-mx";
import { codigoPostalCorrespondeAEstado, estadoDeCodigoPostal } from "@/lib/postal-estados";
import { getShippingZone } from "@/lib/shipping-zones";
import { direccionSchema } from "@/lib/validation";

const base = {
  nombre_completo: "Persona de Prueba",
  telefono: "5512345678",
  calle: "Calle 1 número 2",
  colonia: "Centro",
  ciudad: "Ciudad",
  referencias: "",
};

/** Resultado de validar una dirección y, si pasa, su zona de envío. */
function resolver(estado: string, codigo_postal: string) {
  const parsed = direccionSchema.safeParse({ ...base, estado, codigo_postal });
  return parsed.success ? { ok: true as const, zona: getShippingZone(parsed.data) } : { ok: false as const, error: parsed.error.issues[0]?.message };
}

const MENSAJE = "El código postal no corresponde al estado seleccionado.";

const casos: { estado: string; cp: string; esperado: "metro" | "nacional" | "rechazado" }[] = [
  { estado: "Ciudad de México", cp: "06700", esperado: "metro" },
  { estado: "Ciudad de México", cp: "64000", esperado: "rechazado" },
  { estado: "Nuevo León", cp: "64000", esperado: "nacional" },
  { estado: "Estado de México", cp: "53100", esperado: "metro" },
  { estado: "Estado de México", cp: "50000", esperado: "nacional" },
  { estado: "Hidalgo", cp: "43800", esperado: "metro" },
  { estado: "Jalisco", cp: "06700", esperado: "rechazado" },
  { estado: "Estado de México", cp: "06700", esperado: "rechazado" },
  { estado: "Ciudad de México", cp: "53100", esperado: "rechazado" },
];

for (const { estado, cp, esperado } of casos) {
  const r = resolver(estado, cp);
  if (esperado === "rechazado") {
    assert.equal(r.ok, false, `${estado} + ${cp} debía rechazarse`);
    assert.equal(!r.ok && r.error, MENSAJE, `${estado} + ${cp}: mensaje`);
  } else {
    assert.equal(r.ok && r.zona, esperado, `${estado} + ${cp} debía ser ${esperado}`);
  }
}

// La zona sale solo del CP: el estado ya no abre la zona metro.
assert.equal(getShippingZone({ codigo_postal: "64000" }), "nacional");
assert.equal(getShippingZone({ codigo_postal: "06700" }), "metro");
assert.equal(getShippingZone({ codigo_postal: "abcde" }), "nacional");
assert.equal(getShippingZone({ codigo_postal: "6700" }), "nacional");
assert.equal(getShippingZone(null), "nacional");

// Cada estado tiene al menos un prefijo y ningún prefijo se reparte entre dos estados.
const dueno = new Map<number, string>();
for (const estado of ESTADOS_MX) {
  let tiene = false;
  for (let prefijo = 1; prefijo <= 99; prefijo++) {
    if (!codigoPostalCorrespondeAEstado(String(prefijo).padStart(2, "0") + "000", estado)) continue;
    tiene = true;
    assert.equal(dueno.get(prefijo), undefined, `El prefijo ${prefijo} está en ${dueno.get(prefijo)} y en ${estado}`);
    dueno.set(prefijo, estado);
  }
  assert.ok(tiene, `${estado} no tiene prefijos`);
}

// El estado sugerido para el checkout sale del CP y coincide con la validación.
for (const [prefijo, estado] of dueno) assert.equal(estadoDeCodigoPostal(String(prefijo).padStart(2, "0") + "123"), estado);
assert.equal(estadoDeCodigoPostal("06700"), "Ciudad de México");
assert.equal(estadoDeCodigoPostal("64000"), "Nuevo León");
assert.equal(estadoDeCodigoPostal("1800"), null);
assert.equal(estadoDeCodigoPostal("00123"), null);
assert.equal(estadoDeCodigoPostal("18000"), null);

console.log(`OK: ${casos.length} casos de zona y CP verificados, 32 estados sin prefijos repetidos.`);
