// Pruebas de la barra del carrito: npx tsx scripts/test-cart-progress.ts
import assert from "node:assert/strict";
import { cartProgress, shippingHint } from "../lib/cart-progress";
import { parseLinkedOrders, linkedOrdersMessage } from "../lib/linked-orders";

// Sin CP: primero la meta metro, con la nacional como aclaración.
let p = cartProgress(45, null);
assert.equal(p.target, 1000);
assert.match(p.message, /Te faltan \$955 para el envío gratis en CDMX/);
assert.match(p.detail ?? "", /\$3,000/);

p = cartProgress(1500, null);
assert.equal(p.target, 3000);
assert.match(p.message, /Te faltan \$1,500 para el envío gratis al resto del país/);

p = cartProgress(3000, null);
assert.equal(p.target, 6000);
assert.match(p.message, /^Envío gratis\. Te faltan \$3,000 para el 10 %/);

// Con zona: solo la meta de esa zona y luego el 10 %.
assert.match(cartProgress(900, "metro").message, /Te faltan \$100 para el envío gratis/);
assert.equal(cartProgress(1000, "metro").target, 6000);
assert.equal(cartProgress(2999, "nacional").target, 3000);
assert.match(cartProgress(6000, "nacional").message, /Agrega una cerveza más/);
assert.equal(cartProgress(6005, "nacional").target, null);
assert.equal(cartProgress(6005, "nacional").percent, 100);

// Línea del checkout.
assert.equal(shippingHint(1000, "metro"), "Tu envío es gratis.");
assert.match(shippingHint(1000, "nacional"), /Te faltan \$2,000/);
assert.match(shippingHint(1200, null), /resto del país te faltan \$1,800/);

// Cookie del aviso de pedidos ligados.
assert.deepEqual(parseLinkedOrders("2.11"), { ligados: 2, botellas: 11 });
assert.equal(parseLinkedOrders("0.3"), null);
assert.equal(parseLinkedOrders("x"), null);
assert.equal(linkedOrdersMessage({ ligados: 2, botellas: 11 }), "Encontramos 2 pedidos tuyos y sumamos 11 botellas.");
assert.equal(linkedOrdersMessage({ ligados: 1, botellas: 1 }), "Encontramos 1 pedido tuyo y sumamos 1 botella.");

console.log("test-cart-progress: OK");
