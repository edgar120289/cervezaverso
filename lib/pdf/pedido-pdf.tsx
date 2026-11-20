import "server-only";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { Document, Font, Image, Page, StyleSheet, Text, View, renderToBuffer } from "@react-pdf/renderer";
import { folio, formatFecha } from "@/lib/pedidos";
import { formatMXN, SHIPPING_METHODS } from "@/lib/pricing";
import { METODO_PAGO_LABEL, resumirPagos, type PedidoPago } from "@/lib/pedido-pagos";
import { HEALTH_NOTICE, LEGAL, SITE } from "@/lib/site";
import { normalCase } from "@/lib/text-case";
import type { PedidoCompleto } from "@/lib/pedido-admin";

const ACCENT = "#5433eb";
const CANVAS = "#f2f4f5";
const MUTED = "#666361";

// Fuentes y logo desde archivos del proyecto (readFile + process.cwd() los incluye en el despliegue).
let assets: Promise<{ logo: Buffer }> | null = null;
function loadAssets() {
  assets ??= (async () => {
    const dir = join(process.cwd(), "assets");
    const [w500, w800, logo] = await Promise.all([
      readFile(join(dir, "fonts", "inter-latin-500-normal.woff")),
      readFile(join(dir, "fonts", "inter-latin-800-normal.woff")),
      readFile(join(dir, "pdf", "logo-cervezaverso.png")),
    ]);
    Font.register({
      family: "Inter",
      fonts: [
        { src: `data:font/woff;base64,${w500.toString("base64")}`, fontWeight: 500 },
        { src: `data:font/woff;base64,${w800.toString("base64")}`, fontWeight: 800 },
      ],
    });
    Font.registerHyphenationCallback((word) => [word]);
    return { logo };
  })();
  return assets;
}

const s = StyleSheet.create({
  page: { paddingTop: 30, paddingBottom: 60, paddingHorizontal: 40, fontFamily: "Inter", fontSize: 9.5, color: "#111", fontWeight: 500 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingBottom: 10, borderBottomWidth: 3, borderBottomColor: ACCENT },
  logo: { width: 170, height: 48.5 },
  titleBox: { alignItems: "flex-end" },
  title: { fontSize: 18, fontWeight: 800, color: ACCENT, letterSpacing: -0.5 },
  small: { fontSize: 8.5, color: MUTED },
  row: { flexDirection: "row", gap: 12, marginTop: 12 },
  card: { flex: 1, backgroundColor: CANVAS, borderRadius: 10, padding: 10 },
  label: { fontSize: 7.5, fontWeight: 800, color: MUTED, textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 5 },
  strong: { fontWeight: 800 },
  section: { marginTop: 12 },
  th: { flexDirection: "row", paddingVertical: 6, paddingHorizontal: 8, backgroundColor: ACCENT, color: "#fff", borderRadius: 6, fontWeight: 800, fontSize: 8 },
  tr: { flexDirection: "row", paddingVertical: 4.5, paddingHorizontal: 8, borderBottomWidth: 0.5, borderBottomColor: "#ddd" },
  cName: { flex: 1, paddingRight: 8 },
  cQty: { width: 34, textAlign: "center" },
  cMoney: { width: 70, textAlign: "right" },
  badge: { fontSize: 7, fontWeight: 800, color: ACCENT },
  totals: { marginTop: 4, marginLeft: "auto", width: 230 },
  totalRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 2 },
  grand: { flexDirection: "row", justifyContent: "space-between", marginTop: 4, paddingTop: 6, borderTopWidth: 1.5, borderTopColor: "#111", fontSize: 12, fontWeight: 800 },
  footer: { position: "absolute", left: 40, right: 40, bottom: 24, borderTopWidth: 0.5, borderTopColor: "#ccc", paddingTop: 8, fontSize: 7.5, color: MUTED },
  legend: { fontWeight: 800, color: "#111", fontSize: 8.5, marginBottom: 2 },
});

function Money({ n, bold = false }: { n: number; bold?: boolean }) {
  return <Text style={bold ? [s.cMoney, s.strong] : s.cMoney}>{formatMXN(n)}</Text>;
}

function PagoEstado({ pago }: { pago: PedidoPago }) {
  return pago.estado === "recibido" ? <Text>Recibido</Text> : <Text style={{ color: "#b45309", fontWeight: 800 }}>Pendiente</Text>;
}

function PedidoDocument({ data, logo }: { data: PedidoCompleto; logo: Buffer }) {
  const { pedido, pagos } = data;
  const d = pedido.direccion;
  const resumen = resumirPagos(Number(pedido.total), pagos);
  const piezas = pedido.pedido_items.reduce((sum, item) => sum + item.cantidad, 0);
  const botellasTexto = !pedido.user_id
    ? "Compra como invitado: no suma botellas."
    : pedido.botellas_acreditadas_at
      ? `${pedido.botellas_acreditadas ?? 0} botellas acreditadas a tu cuenta.`
      : `${piezas} botellas se acreditan al confirmarse el pago.`;

  return (
    <Document title={`Pedido #${folio(pedido.id)} · ${SITE.name}`} author={SITE.name} language="es-MX">
      <Page size="LETTER" style={s.page}>
        <View style={s.header}>
          {/* eslint-disable-next-line jsx-a11y/alt-text -- Image de react-pdf no tiene alt; el PDF lleva título. */}
          <Image style={s.logo} src={{ data: logo, format: "png" }} />
          <View style={s.titleBox}>
            <Text style={s.title}>Pedido #{folio(pedido.id)}</Text>
            <Text style={s.small}>Fecha del pedido: {formatFecha(pedido.fecha)}</Text>
            <Text style={s.small}>Emitido: {formatFecha(new Date().toISOString())}</Text>
            <Text style={[s.small, s.strong, { color: "#111" }]}>Estado: {pedido.estado}</Text>
          </View>
        </View>

        <View style={s.row}>
          <View style={s.card}>
            <Text style={s.label}>Cliente</Text>
            <Text style={s.strong}>{pedido.cliente_nombre}</Text>
            <Text>{pedido.cliente_email}</Text>
            {pedido.cliente_telefono ? <Text>Tel. {pedido.cliente_telefono}</Text> : null}
          </View>
          <View style={s.card}>
            <Text style={s.label}>Dirección de entrega</Text>
            {d ? (
              <>
                <Text style={s.strong}>{d.nombre_completo}</Text>
                <Text>{d.calle}</Text>
                <Text>
                  {d.colonia}, {d.ciudad}
                </Text>
                <Text>
                  {d.estado}, C.P. {d.codigo_postal}
                </Text>
                {d.referencias ? <Text style={s.small}>Ref.: {d.referencias}</Text> : null}
              </>
            ) : (
              <Text style={s.small}>Sin dirección registrada.</Text>
            )}
          </View>
        </View>

        <View style={s.section}>
          <Text style={s.label}>Productos</Text>
          <View style={s.th}>
            <Text style={s.cName}>Cerveza</Text>
            <Text style={s.cQty}>Cant.</Text>
            <Text style={s.cMoney}>Precio</Text>
            <Text style={s.cMoney}>Importe</Text>
          </View>
          {pedido.pedido_items.map((item) => (
            <View key={item.id} style={s.tr} wrap={false}>
              <View style={s.cName}>
                <Text style={s.strong}>{normalCase(item.nombre)}</Text>
                <Text style={s.small}>
                  {item.sku}
                  {item.agregado ? "  ·  " : ""}
                  {item.agregado ? <Text style={s.badge}>AGREGADO DESPUÉS DEL PEDIDO</Text> : null}
                </Text>
              </View>
              <Text style={s.cQty}>{item.cantidad}</Text>
              <Money n={Number(item.precio_unitario)} />
              <Money n={Number(item.importe)} bold />
            </View>
          ))}
          <View style={s.totals}>
            <View style={s.totalRow}>
              <Text>Subtotal</Text>
              <Text>{formatMXN(Number(pedido.subtotal))}</Text>
            </View>
            {Number(pedido.descuento ?? 0) > 0 ? (
              <View style={s.totalRow}>
                <Text>Descuento{pedido.promo_code ? ` (${pedido.promo_code})` : ""}</Text>
                <Text>−{formatMXN(Number(pedido.descuento))}</Text>
              </View>
            ) : null}
            {Number(pedido.descuento_volumen ?? 0) > 0 ? (
              <View style={s.totalRow}>
                <Text>Descuento por volumen (10 %)</Text>
                <Text>−{formatMXN(Number(pedido.descuento_volumen))}</Text>
              </View>
            ) : null}
            <View style={s.totalRow}>
              <Text>Envío · {SHIPPING_METHODS[pedido.metodo_envio]?.label ?? "Paquetería"}</Text>
              <Text>{Number(pedido.costo_envio) === 0 ? "Gratis" : formatMXN(Number(pedido.costo_envio))}</Text>
            </View>
            <View style={s.grand}>
              <Text>Total</Text>
              <Text>{formatMXN(Number(pedido.total))}</Text>
            </View>
          </View>
        </View>

        <View style={s.section} wrap={false}>
          <Text style={s.label}>Pagos</Text>
          {pagos.length === 0 ? (
            <Text style={s.small}>Aún no hay pagos registrados.</Text>
          ) : (
            <>
              <View style={s.th}>
                <Text style={s.cName}>Concepto</Text>
                <Text style={{ width: 120 }}>Fecha</Text>
                <Text style={{ width: 70 }}>Estado</Text>
                <Text style={s.cMoney}>Monto</Text>
              </View>
              {pagos.map((pago) => (
                <View key={pago.id} style={s.tr}>
                  <Text style={s.cName}>
                    {pago.es_original ? "Pago original" : "Pago adicional"} · {METODO_PAGO_LABEL[pago.metodo]}
                  </Text>
                  <Text style={{ width: 120 }}>{formatFecha(pago.recibido_at ?? pago.fecha)}</Text>
                  <View style={{ width: 70 }}>
                    <PagoEstado pago={pago} />
                  </View>
                  <Money n={pago.monto} />
                </View>
              ))}
            </>
          )}
          <View style={s.totals}>
            <View style={s.totalRow}>
              <Text>Pagado</Text>
              <Text>{formatMXN(resumen.recibido)}</Text>
            </View>
            {resumen.pendiente > 0 ? (
              <View style={[s.totalRow, { color: "#b45309" }]}>
                <Text style={s.strong}>Pendiente por pagar</Text>
                <Text style={s.strong}>{formatMXN(resumen.pendiente)}</Text>
              </View>
            ) : null}
          </View>
        </View>

        <View style={s.row} wrap={false}>
          <View style={s.card}>
            <Text style={s.label}>Botellas · Mi Tribu Cervecera</Text>
            <Text>{botellasTexto}</Text>
          </View>
          <View style={s.card}>
            <Text style={s.label}>Paquetería y guía</Text>
            {pedido.guia ? (
              <>
                <Text style={s.strong}>{pedido.paqueteria ?? "Paquetería"}</Text>
                <Text>Guía: {pedido.guia}</Text>
                {pedido.guia_url ? <Text style={[s.small, { color: ACCENT }]}>{pedido.guia_url}</Text> : null}
              </>
            ) : (
              <Text style={s.small}>La guía se comparte cuando el pedido sale.</Text>
            )}
          </View>
        </View>

        {pedido.notas ? (
          <View style={s.section} wrap={false}>
            <Text style={s.label}>Notas del cliente</Text>
            <Text>{pedido.notas}</Text>
          </View>
        ) : null}

        <View style={s.footer} fixed>
          <Text style={s.legend}>{HEALTH_NOTICE} +18</Text>
          <Text>
            {LEGAL.razonSocial} · RFC {LEGAL.rfc} · {SITE.url.replace(/^https?:\/\//, "")}
          </Text>
          <Text render={({ pageNumber, totalPages }) => `Página ${pageNumber} de ${totalPages}`} style={{ position: "absolute", right: 0, top: 8 }} />
        </View>
      </Page>
    </Document>
  );
}

export function nombreArchivoPdf(id: string) {
  return `cervezaverso-pedido-${folio(id)}.pdf`;
}

export async function renderPedidoPdf(data: PedidoCompleto): Promise<Buffer> {
  const { logo } = await loadAssets();
  return renderToBuffer(<PedidoDocument data={data} logo={logo} />);
}
