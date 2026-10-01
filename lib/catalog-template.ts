/**
 * Plantilla de carga masiva del catálogo (CSV). Las cabeceras de aquí son las
 * que espera `lib/catalog-import.ts`; el panel genera la plantilla con ellas.
 */
export const TEMPLATE_HEADERS = ["Nombre", "País", "Estilo", "ABV", "Volumen (ml)", "Precio", "Stock"] as const;

export const TEMPLATE_FILENAME = "plantilla-catalogo-cervezaverso.csv";

/** CSV con BOM UTF-8 para que Excel respete los acentos. */
export function buildTemplateCsv(): string {
  return `﻿${TEMPLATE_HEADERS.join(",")}\r\n`;
}
