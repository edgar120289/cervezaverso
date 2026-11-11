#!/usr/bin/env python3
"""Genera la cotización formal de Cervezaverso en PDF a partir de un JSON.

Uso:  python3 scripts/cotizaciones/generar_cotizacion.py datos.json salida.pdf
Ejemplo de datos: scripts/cotizaciones/ejemplo-igsa.json

Regla de precios: los precios unitarios del JSON ya INCLUYEN impuestos (neto). El PDF desglosa hacia atrás:
subtotal = neto / (1 + IVA); IVA = neto - subtotal. Si `ieps_pct` > 0 se desglosa también el IEPS (ver `desglose`).
Requiere: reportlab (pip install reportlab --break-system-packages) y la fuente Liberation Sans.
"""
import json
import sys
from decimal import Decimal, ROUND_HALF_UP
from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_RIGHT
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (BaseDocTemplate, Frame, Image, KeepTogether, PageTemplate, Paragraph, Spacer, Table,
                                TableStyle)

RAIZ = Path(__file__).resolve().parents[2]
FUENTES = Path("/usr/share/fonts/truetype/liberation")
pdfmetrics.registerFont(TTFont("F", str(FUENTES / "LiberationSans-Regular.ttf")))
pdfmetrics.registerFont(TTFont("F-B", str(FUENTES / "LiberationSans-Bold.ttf")))
pdfmetrics.registerFont(TTFont("F-I", str(FUENTES / "LiberationSans-Italic.ttf")))
pdfmetrics.registerFontFamily("F", normal="F", bold="F-B", italic="F-I", boldItalic="F-B")

ORO = colors.HexColor("#b8731a")      # dorado de marca (legible sobre blanco)
TINTA = colors.HexColor("#0b0d0e")
GRIS = colors.HexColor("#5b6770")
LINEA = colors.HexColor("#dfe3e6")
FONDO = colors.HexColor("#f2f4f5")

D = lambda v: Decimal(str(v))
q2 = lambda v: v.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
money = lambda v: "${:,.2f}".format(q2(v))


def estilo(nombre, **kw):
    base = dict(fontName="F", fontSize=9, leading=12, textColor=TINTA)
    base.update(kw)
    return ParagraphStyle(nombre, **base)


S = {
    "n": estilo("n"),
    "chico": estilo("chico", fontSize=8, leading=11, textColor=GRIS),
    "h": estilo("h", fontName="F-B", fontSize=10.5, leading=14, textColor=ORO, spaceBefore=4, spaceAfter=3),
    "titulo": estilo("titulo", fontName="F-B", fontSize=22, leading=26, alignment=TA_RIGHT),
    "der": estilo("der", alignment=TA_RIGHT),
    "derchico": estilo("derchico", fontSize=8.5, leading=12, textColor=GRIS, alignment=TA_RIGHT),
    "th": estilo("th", fontName="F-B", fontSize=8.5, textColor=colors.white),
    "thr": estilo("thr", fontName="F-B", fontSize=8.5, textColor=colors.white, alignment=TA_RIGHT),
}


def desglose(items, iva_pct, ieps_pct=0):
    """Devuelve (renglones, subtotal, ieps, iva, total). Los importes de `items` ya incluyen impuestos."""
    iva_f = D(iva_pct) / 100
    ieps_f = D(ieps_pct) / 100
    renglones, sub, ieps, iva, total = [], D(0), D(0), D(0), D(0)
    for it in items:
        neto = D(it["cantidad"]) * D(it["precio_neto"])
        # neto = base * (1 + ieps) * (1 + iva)  (el IVA se calcula sobre base + IEPS)
        base = neto / ((1 + ieps_f) * (1 + iva_f))
        i_ieps = base * ieps_f
        i_iva = neto - base - i_ieps
        renglones.append((it, neto, q2(base / D(it["cantidad"])), q2(base)))
        sub += q2(base); ieps += q2(i_ieps); total += neto
    iva = total - sub - ieps   # el IVA absorbe el centavo de redondeo para que todo cuadre con el total
    return renglones, sub, ieps, iva, total


def construir(datos, salida):
    e = datos["emisor"]
    c = datos["cliente"]
    iva_pct = datos.get("iva_pct", 16)
    ieps_pct = datos.get("ieps_pct", 0)
    renglones, sub, ieps, iva, total = desglose(datos["conceptos"], iva_pct, ieps_pct)

    def pie(canvas, doc):
        canvas.saveState()
        canvas.setStrokeColor(LINEA)
        canvas.line(18 * mm, 16 * mm, letter[0] - 18 * mm, 16 * mm)
        canvas.setFont("F", 7.5)
        canvas.setFillColor(GRIS)
        canvas.drawString(18 * mm, 11.5 * mm, f"{e['razon_social']} · RFC {e['rfc']} · {e['sitio']}")
        canvas.drawRightString(letter[0] - 18 * mm, 11.5 * mm, f"Folio {datos['folio']} · Página {doc.page}")
        canvas.drawString(18 * mm, 7.5 * mm, datos.get("leyenda", ""))
        canvas.restoreState()

    doc = BaseDocTemplate(salida, pagesize=letter, leftMargin=18 * mm, rightMargin=18 * mm, topMargin=11 * mm,
                          bottomMargin=20 * mm, title=f"Cotización {datos['folio']} · {c['nombre']}",
                          author=e["razon_social"])
    ancho = letter[0] - 36 * mm
    doc.addPageTemplates([PageTemplate(id="p", frames=[Frame(18 * mm, 20 * mm, ancho, letter[1] - 31 * mm, 0, 0, 0, 0)],
                                       onPage=pie)])
    h = []

    # Encabezado: logotipo + título y folio
    logo = Image(str(RAIZ / datos["logo"]), width=56 * mm, height=56 * mm * 320 / 922)
    der = [Paragraph("COTIZACIÓN", S["titulo"]),
           Paragraph(f"Folio <b>{datos['folio']}</b><br/>Fecha: {datos['fecha']}<br/>Vigencia: {datos['vigencia']}", S["derchico"])]
    t = Table([[logo, der]], colWidths=[ancho * 0.5, ancho * 0.5])
    t.setStyle(TableStyle([("VALIGN", (0, 0), (-1, -1), "MIDDLE"), ("LEFTPADDING", (0, 0), (-1, -1), 0),
                           ("RIGHTPADDING", (0, 0), (-1, -1), 0)]))
    h += [t, Spacer(1, 2.5 * mm)]

    # Emisor y cliente
    emisor = Paragraph(f"<font color='#b8731a'><b>DE</b></font><br/><b>{e['razon_social']}</b><br/>RFC {e['rfc']}<br/>"
                       f"{e['domicilio']}<br/>{e['email']} · WhatsApp {e['whatsapp']}", S["n"])
    cli_lineas = "".join(f"<br/>{x}" for x in c.get("detalle", []))
    cliente = Paragraph(f"<font color='#b8731a'><b>DIRIGIDA A</b></font><br/><b>{c['nombre']}</b>{cli_lineas}", S["n"])
    t = Table([[emisor, cliente]], colWidths=[ancho * 0.56, ancho * 0.44])
    t.setStyle(TableStyle([("BOX", (0, 0), (-1, -1), 0.6, LINEA), ("LINEAFTER", (0, 0), (0, 0), 0.6, LINEA),
                           ("BACKGROUND", (0, 0), (-1, -1), FONDO), ("VALIGN", (0, 0), (-1, -1), "TOP"),
                           ("LEFTPADDING", (0, 0), (-1, -1), 8), ("RIGHTPADDING", (0, 0), (-1, -1), 8),
                           ("TOPPADDING", (0, 0), (-1, -1), 5), ("BOTTOMPADDING", (0, 0), (-1, -1), 5)]))
    h += [t, Spacer(1, 3.5 * mm)]

    # Conceptos
    filas = [[Paragraph(x, S["th"]) for x in ("CONCEPTO",)] + [Paragraph(x, S["thr"]) for x in
             ("CANT.", "P. UNIT.<br/>(sin imp.)", "IMPORTE<br/>(sin imp.)", "IMPORTE NETO<br/>(con imp.)")]]
    for it, neto, p_unit, base in renglones:
        cant = D(it["cantidad"])
        desc = f"<b>{it['nombre']}</b>" + (f"<br/><font size=8 color='#5b6770'>{it['detalle']}</font>" if it.get("detalle") else "")
        filas.append([Paragraph(desc, S["n"]), Paragraph(f"{cant:,.0f} {it.get('unidad', '')}".strip(), S["der"]),
                      Paragraph(money(p_unit), S["der"]), Paragraph(money(base), S["der"]),
                      Paragraph(money(neto), S["der"])])
    cw = [ancho * 0.31, ancho * 0.16, ancho * 0.16, ancho * 0.17, ancho * 0.20]
    t = Table(filas, colWidths=cw, repeatRows=1)
    t.setStyle(TableStyle([("BACKGROUND", (0, 0), (-1, 0), TINTA), ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                           ("LINEBELOW", (0, 1), (-1, -1), 0.5, LINEA), ("TOPPADDING", (0, 0), (-1, -1), 4),
                           ("BOTTOMPADDING", (0, 0), (-1, -1), 4), ("LEFTPADDING", (0, 0), (-1, -1), 6),
                           ("RIGHTPADDING", (0, 0), (-1, -1), 6)]))
    h += [t, Spacer(1, 3 * mm)]

    # Desglose de impuestos y total
    resumen = [["Subtotal (sin impuestos)", money(sub)]]
    if ieps_pct:
        resumen.append([f"IEPS ({ieps_pct}%)", money(ieps)])
    resumen.append([f"IVA ({iva_pct}%)", money(iva)])
    resumen.append(["TOTAL (impuestos incluidos, facturado y entregado)", money(total)])
    t = Table([[Paragraph(a, S["der"]), Paragraph(b, S["der"])] for a, b in resumen],
              colWidths=[ancho * 0.66, ancho * 0.34], hAlign="RIGHT")
    n = len(resumen)
    t.setStyle(TableStyle([("TOPPADDING", (0, 0), (-1, -1), 3), ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
                           ("LINEABOVE", (0, n - 1), (-1, n - 1), 1, ORO), ("BACKGROUND", (0, n - 1), (-1, n - 1), FONDO),
                           ("FONTNAME", (0, n - 1), (-1, n - 1), "F-B"), ("TOPPADDING", (0, n - 1), (-1, n - 1), 6),
                           ("BOTTOMPADDING", (0, n - 1), (-1, n - 1), 6)]))
    # el total en negritas
    t._cellvalues[n - 1] = [Paragraph(f"<b>{resumen[-1][0]}</b>", S["der"]), Paragraph(f"<b>{resumen[-1][1]} MXN</b>", S["der"])]
    h += [t, Spacer(1, 3.5 * mm)]

    # Esquema de pago
    pagos = datos.get("pagos", [])
    if pagos:
        fil = [[Paragraph(x, S["th"]) for x in ("ESQUEMA DE PAGO", "")] + [Paragraph("MONTO", S["thr"])]]
        for p in pagos:
            monto = q2(total * D(p["porcentaje"]) / 100)
            fil.append([Paragraph(f"<b>{p['porcentaje']}%</b> · {p['nombre']}", S["n"]), Paragraph(p["cuando"], S["n"]),
                        Paragraph(f"<b>{money(monto)}</b>", S["der"])])
        t = Table(fil, colWidths=[ancho * 0.30, ancho * 0.50, ancho * 0.20])
        t.setStyle(TableStyle([("BACKGROUND", (0, 0), (-1, 0), TINTA), ("LINEBELOW", (0, 1), (-1, -1), 0.5, LINEA),
                               ("VALIGN", (0, 0), (-1, -1), "MIDDLE"), ("TOPPADDING", (0, 0), (-1, -1), 3),
                               ("BOTTOMPADDING", (0, 0), (-1, -1), 3)]))
        h += [t, Spacer(1, 3.5 * mm)]

    # Comentarios
    if datos.get("comentarios"):
        h.append(Paragraph("COMENTARIOS", S["h"]))
        for cm in datos["comentarios"]:
            h.append(Paragraph(f"•&nbsp;&nbsp;{cm}", estilo("li", leftIndent=10, firstLineIndent=-10, spaceAfter=2)))
        h.append(Spacer(1, 2.5 * mm))

    # Formas de pago
    b = datos["banco"]
    transf = Paragraph(
        f"<b>1 · Transferencia interbancaria (SPEI)</b><br/>Beneficiario: <b>{b['beneficiario']}</b><br/>"
        f"Banco: <b>{b['banco']}</b><br/>CLABE: <b>{b['clabe']}</b><br/>Concepto: <b>{datos['folio']}</b><br/>"
        f"<font size=8 color='#5b6770'>{b.get('nota', '')}</font>", S["n"])
    pagos_portal = datos["portal"]
    portal = Paragraph(
        f"<b>2 · Pago en nuestro portal</b><br/>{pagos_portal['sitio']}<br/>{pagos_portal['metodos']}<br/>"
        f"<font size=8 color='#5b6770'>{pagos_portal.get('nota', '')}</font>", S["n"])
    t = Table([[transf, portal]], colWidths=[ancho * 0.5, ancho * 0.5])
    t.setStyle(TableStyle([("BOX", (0, 0), (-1, -1), 0.6, LINEA), ("LINEAFTER", (0, 0), (0, 0), 0.6, LINEA),
                           ("VALIGN", (0, 0), (-1, -1), "TOP"), ("LEFTPADDING", (0, 0), (-1, -1), 8),
                           ("RIGHTPADDING", (0, 0), (-1, -1), 8), ("TOPPADDING", (0, 0), (-1, -1), 5),
                           ("BOTTOMPADDING", (0, 0), (-1, -1), 5)]))
    ayuda = Table([[Paragraph(f"¿Necesitas ayuda con tu pago o tu pedido? Escríbenos por WhatsApp al <b>{e['whatsapp']}</b> "
                              f"o a {e['email']}. Envía tu comprobante de pago por el mismo medio.", S["n"])]],
                  colWidths=[ancho])
    ayuda.setStyle(TableStyle([("BACKGROUND", (0, 0), (-1, -1), FONDO), ("LEFTPADDING", (0, 0), (-1, -1), 8),
                               ("TOPPADDING", (0, 0), (-1, -1), 6), ("BOTTOMPADDING", (0, 0), (-1, -1), 6)]))
    h.append(KeepTogether([Paragraph("FORMAS DE PAGO", S["h"]), t, Spacer(1, 2 * mm), ayuda]))

    doc.build(h)
    return {"subtotal": sub, "ieps": ieps, "iva": iva, "total": total}


if __name__ == "__main__":
    if len(sys.argv) != 3:
        sys.exit(__doc__)
    r = construir(json.load(open(sys.argv[1], encoding="utf-8")), sys.argv[2])
    print({k: str(q2(v)) for k, v in r.items()})
