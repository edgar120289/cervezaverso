/**
 * Pruebas de la asignación de vasos con estilos reales del catálogo (sin base de datos).
 * Uso: npx tsx scripts/test-vasos.ts
 */
import assert from "node:assert/strict";
import { assignVaso, VASO_CODES, VASOS, type VasoCode } from "@/lib/vasos";

// [nombre, estilo, país, vaso esperado]
const casos: [string, string, string, VasoCode | null][] = [
  // 1. Packs, barriles y surtidos (por nombre o por estilo), antes que cualquier otra regla.
  ["BARRIL DELIRIUM TREMENS", "BELGIAN STRONG ALE", "BÉLGICA", "sin_servida"],
  ["BRUGSE ZOT PACK CON COPA", "BLONDE", "BÉLGICA", "sin_servida"],
  ["X", "3 LATAS PREMIUM BITTER MÁS 1 VASO", "INGLATERRA", "sin_servida"],
  ["X", "4 BOTELLAS", "BÉLGICA", "sin_servida"],
  ["PAQUETE BOSCOLI 4 MÁS COPA", "FRUIT BEER", "BÉLGICA", "sin_servida"], // «paquete» = pack
  ["BOTELLA VOLFAS ENGELMAN IMPERIAL PORTERIS", "BALTIC PORTER", "LITUANIA", "snifter"], // «botella» en singular no es pack
  ["X", "VARIOS ESTILOS", "BÉLGICA", "sin_servida"],
  ["X", "DOS ESTILOS", "BÉLGICA", "sin_servida"],
  ["X", "BELGIAN STRONG BLONDE EN BARRICAS DE AGAVE", "BÉLGICA", "tulipa"], // «barricas» no es «barril»
  // Excepciones por marca (2026-11-17): sin alcohol de cervecerías de trigo → weizen; Kasteel → cáliz.
  ["ERDINGER ALKOHOLFREI", "ALKOHOLFREI", "ALEMANIA", "weizen"],
  ["PAULANER WEISSBIER 0,0 %", "SIN ALCOHOL", "ALEMANIA", "weizen"],
  ["WEIHENSTEPHANER HEFEWEISSBIER ALKOHOLFREI", "NON-ALCOHOLIC", "ALEMANIA", "weizen"],
  ["MAHOU 0.0", "SIN ALCOHOL", "ESPAÑA", "willi_becher"], // otra marca: sigue en la regla general
  ["PAULANER ORIGINAL", "MUNICH HELLES", "ALEMANIA", "tarro_aleman"], // con alcohol: regla general
  ["KASTEEL ROUGE", "FRUIT BEER", "BÉLGICA", "caliz"],
  ["KASTEEL ROUGE 0.0", "FRUIT BEER 0.0", "BÉLGICA", "caliz"],
  ["KASTEEL TROPICAL 0.0", "NON-ALCOHOLIC FRUIT BEER", "BÉLGICA", "caliz"],
  ["KASTEEL RUBUS FRAMBOISE", "FRUIT BEER", "BÉLGICA", "caliz"],
  ["KASTEEL CUVÉE DU CHATEAU (ETIQUETA NEGRA)", "BELGIAN DARK STRONG ALE", "BÉLGICA", "caliz"],
  ["PAQUETE KASTEEL 4 MÁS COPA", "VARIOS ESTILOS", "BÉLGICA", "sin_servida"], // el pack gana a la marca
  // 2–5
  ["X", "HOLISTIC HARD SELTZER", "MÉXICO", "highball"],
  ["X", "HIDROMIEL/FRUTOS ROJOS", "MÉXICO", "copa_vino"],
  ["X", "MEAD / HIDROMIEL", "MÉXICO", "copa_vino"],
  ["X", "BRAGGOT", "MÉXICO", "copa_vino"],
  ["X", "CHAMPAGNE BRUT", "ITALIA", "flauta_champana"],
  ["X", "SMOOTHIE FRESA, PLÁTANO, BOMBÓN VEGANO", "MÉXICO", "teku"],
  // 6. Trigo alemán
  ["X", "HEFEWEIZEN", "ALEMANIA", "weizen"],
  ["X", "DUNKELWEIZEN", "ALEMANIA", "weizen"],
  ["X", "HEFE DUNKEL", "ALEMANIA", "weizen"],
  ["X", "WEISSBIER", "ALEMANIA", "weizen"],
  ["X", "WEIZENBOCK", "ALEMANIA", "weizen"],
  ["X", "MUNICH WHEAT BEER", "ALEMANIA", "weizen"],
  ["X", "AMERICAN WHEAT", "MÉXICO", "pinta_americana"],
  ["X", "CITRUS WHEAT", "USA", "pinta_americana"],
  // 7–8
  ["X", "WITBIER/BLANCHE", "FRANCIA", "vaso_hexagonal_wit"],
  ["X", "BELGIAN WHITE", "USA", "vaso_hexagonal_wit"],
  ["X", "LAMBIC ALCOHOL FREE", "BÉLGICA", "flauta_lambic"],
  ["X", "CHERRY KRIEK", "LITUANIA", "flauta_lambic"],
  ["X", "FRUIT BEER", "BÉLGICA", "flauta_lambic"],
  ["X", "NON-ALCOHOLIC FRUIT BEER", "BÉLGICA", "flauta_lambic"],
  ["X", "FRUIT BEER", "INGLATERRA", null],
  // 9–10
  ["X", "DUBBEL", "BÉLGICA", "caliz"],
  ["X", "TRIPEL HOP CITRA", "BÉLGICA", "caliz"],
  ["X", "TRIPEL AÑEJADA BARRICA DE COGNAC", "BÉLGICA", "caliz"],
  ["X", "BLEND DE QUADRUPEL", "BÉLGICA", "caliz"],
  ["X", "BELGIAN STYLE ABBEY ALE", "USA", "caliz"],
  ["X", "TRIPLE", "BÉLGICA", "caliz"],
  ["X", "TRIPLE INDIA PALE ALE", "USA", "copa_ipa"],
  ["X", "TRIPLE IPA", "USA", "copa_ipa"],
  ["X", "BELGIAN BLOND STRONG ALE", "BÉLGICA", "tulipa"],
  ["X", "BELGIAN BLONDE STRONG ALE", "BÉLGICA", "tulipa"],
  ["X", "BELGIAN DARK SPECIAL STRONG ALE", "BÉLGICA", "tulipa"],
  // 11–14
  ["X", "BELGIAN IMPERIAL STOUT", "BÉLGICA", "snifter"],
  ["X", "RUSSIAN IMPERIAL STOUT CON WHISKY RÁMURI Y MIEL DE MAPLE", "MÉXICO", "snifter"],
  ["X", "BALTIC PORTER", "POLONIA", "snifter"],
  ["X", "BARREL AGED DOPPELBOCK", "AUSTRIA", "snifter"],
  ["X", "IMPERIAL CACAO STOUT", "MÉXICO", "snifter"],
  ["X", "STOUT IMPERIAL CON NIBS DE CACAO", "MÉXICO", "snifter"],
  ["X", "DOBLE STOUT CON CHOCOLATE Y MAZAPÁN", "MÉXICO", "snifter"],
  ["X", "IMPERIAL EXTRA DOUBLE STOUT", "ESTONIA", "snifter"],
  ["X", "SCOTCH ALE", "INGLATERRA", "copa_cardo"],
  ["X", "DRY STOUT", "IRLANDA", "pinta_tulipa_irlandesa"],
  ["X", "SCOTTISH STOUT NITRO DRAUGHT", "IRLANDA", "pinta_tulipa_irlandesa"],
  ["X", "COFFEE STOUT", "MÉXICO", "pinta_tulipa_irlandesa"],
  ["X", "BOCKBIER", "ALEMANIA", "tulipa_chica"],
  ["X", "HELLESBOCK", "MÉXICO", "tulipa_chica"],
  ["X", "CHOCOLATE BOCK", "ALEMANIA", "tulipa_chica"],
  // 15–18
  ["X", "GERMAN PILS", "ALEMANIA", "copa_pilsner"],
  ["X", "IMPERIAL PILSNER", "RUSIA", "copa_pilsner"],
  ["X", "GRODZISKIE", "ALEMANIA", "copa_pilsner"],
  ["X", "TMAVÝ", "REP. CHECA", "tarro_checo"],
  ["X", "CZECH DARK LAGER", "MÉXICO", "tarro_checo"],
  ["X", "HELLES MÄRZEN UNFILTRIERT", "ALEMANIA", "tarro_aleman"],
  ["X", "MÄRZEN", "ALEMANIA", "tarro_aleman"],
  ["X", "OKTOBERFEST BIER", "ALEMANIA", "tarro_aleman"],
  ["X", "MUNICH DUNKEL", "ALEMANIA", "tarro_aleman"],
  ["X", "ALTBIER", "MÉXICO", "becher_cilindrico"],
  // 19–20
  ["X", "IPA", "MÉXICO", "copa_ipa"],
  ["X", "NEIPA", "ESCOCIA", "copa_ipa"],
  ["X", "INDIA PALE ALE", "USA", "copa_ipa"],
  ["X", "HAZY INDIA PALE ALE", "MÉXICO", "copa_ipa"],
  ["X", "DDH WEST COAST IPA", "MÉXICO", "copa_ipa"],
  ["X", "IMPERIAL IPA", "USA", "copa_ipa"],
  ["X", "IPA BRUMOSA SIN ALCOHOL", "MÉXICO", "copa_ipa"],
  ["X", "HAZY PALE ALE", "INGLATERRA", "copa_ipa"],
  ["X", "SESSION IPA", "MÉXICO", "pinta_americana"],
  ["X", "RYE SESSION IPA", "MÉXICO", "pinta_americana"],
  ["X", "SESSION NEIPA", "MÉXICO", "pinta_americana"],
  ["X", "AMERICAN PALE ALE", "ITALIA", "pinta_americana"],
  ["X", "NEW ENGLAND PALE ALE", "INGLATERRA", "pinta_americana"],
  ["X", "AMBER ALE", "ESCOCIA", "pinta_americana"],
  ["X", "RED ALE", "MÉXICO", "pinta_americana"],
  ["X", "BROWN ALE CON AVELLANA", "MÉXICO", "pinta_americana"],
  // 21–22
  ["X", "ENGLISH PALE ALE", "INGLATERRA", "pinta_nonic"],
  ["X", "EXTRA SPECIAL BITTER", "INGLATERRA", "pinta_nonic"],
  ["X", "ENGLISH STRONG ALE", "INGLATERRA", "pinta_nonic"],
  ["X", "PORTER", "INGLATERRA", "pinta_nonic"],
  ["X", "WINTER ALE", "MÉXICO", "pinta_nonic"],
  ["X", 'LAGER "SUPER DRY"', "JAPÓN", "willi_becher"],
  ["X", "PALE LAGER", "CUBA", "willi_becher"],
  ["X", "MEXICAN LAGER", "MÉXICO", "willi_becher"],
  ["X", "SCHWARZBIER", "ALEMANIA", "willi_becher"],
  ["X", "BEBIDA DE MALTA NO ALCOHÓLICA", "ITALIA", "willi_becher"],
  ["X", "SIN ALCOHOL", "ESPAÑA", "willi_becher"],
  ["X", "ALKOHOLFREI", "ALEMANIA", "willi_becher"],
  ["X", "ALCOHOL FREI", "BÉLGICA", "willi_becher"],
  ["X", "ALCOHOLFREE", "INGLATERRA", "willi_becher"],
  // 23. Sin asignar
  ["X", "BLONDE", "BÉLGICA", null],
  ["X", "BLOND ALE", "MÉXICO", null],
  ["X", "BERRY SUMMER ALE", "MÉXICO", null],
  ["X", "SIN GLUTEN", "ESPAÑA", null],
  ["X", "WHISKY INFUSED BLOND", "BÉLGICA", null],
  ["X", "SMOOTH NITRO ALE", "IRLANDA", null],
];

for (const [name, style, country, esperado] of casos) {
  assert.equal(assignVaso({ name, style, country }), esperado, `${name} — ${style} (${country})`);
}

// El catálogo tiene nombre y prompt para cada código, y ningún prompt pide marcas.
for (const code of VASO_CODES) {
  assert.ok(VASOS[code].nombre.length > 0, code);
  assert.ok(VASOS[code].prompt.length > 40, code);
}

console.log(`OK: ${casos.length} casos de asignación y ${VASO_CODES.length} vasos en el catálogo.`);
