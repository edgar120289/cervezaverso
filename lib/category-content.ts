/**
 * Textos editables de las 24 páginas de categoría (/catalogo/pais/* y /catalogo/estilo/*), uno por slug.
 * `meta` es la meta descripción; `body` va debajo de la cuadrícula, bajo un H2 «Sobre la cerveza …».
 * Los slugs deben existir en `COUNTRY_CATEGORIES` / `STYLE_CATEGORIES` (lib/seo-categories.ts).
 */
export type CategoryContent = { meta: string; body: string };

export const COUNTRY_CONTENT: Record<string, CategoryContent> = {
  mexico: {
    meta: "Cerveza artesanal mexicana a domicilio: Calavera, Wendlandt, Rámuri, Santa Sabina, Monkey Waves y más. Envío gratis en CDMX desde $1,000.",
    body: "La cerveza artesanal mexicana vive su mejor momento, y en Cervezaverso reunimos etiquetas de cervecerías independientes de todo el país: las stouts de Calavera y Rámuri, las IPA de Wendlandt, Rey Árbol y Monkey Waves, y las propuestas de Santa Sabina, Interstellar, Fauna y Jabalí, entre otras. Elegimos cervezas que no encuentras en cualquier tienda: lanzamientos, colaboraciones y ediciones de temporada. Si no sabes por dónde empezar, Graciela te recomienda una según tu gusto. Envío gratis en CDMX y zona metropolitana desde $1,000, con entrega en 24 a 48 horas, y envíos a todo México.",
  },
  belgica: {
    meta: "Cerveza belga a domicilio: Duvel, Delirium, Chouffe, Kasteel, Gulden Draak y Westvleteren 12. Envío gratis en CDMX desde $1,000.",
    body: "Bélgica es el país de las cervezas con más carácter: trapenses y de abadía, dubbel, tripel y quadrupel, y lambics de fermentación espontánea. En Cervezaverso encuentras clásicos como Duvel, Delirium Tremens, La Chouffe, Kasteel, Gulden Draak, Carolus y Straffe Hendrik, frutales de Lindemans y Boscoli, y joyas como la Westvleteren 12. Muchas pasan de 8% de alcohol y se disfrutan mejor despacio, en copa y no tan frías. También hay paquetes con copa para regalar. Envío gratis en CDMX y zona metropolitana desde $1,000, con entrega en 24 a 48 horas, y envíos a todo México.",
  },
  alemania: {
    meta: "Cerveza alemana a domicilio: Paulaner, Erdinger, Weihenstephaner, Hofbräu, Schlenkerla y más. Envío gratis en CDMX desde $1,000.",
    body: "La cerveza alemana es sinónimo de tradición: la ley de pureza de 1516 todavía marca su forma de hacer cerveza. En Cervezaverso tienes las weissbier de Paulaner, Erdinger, Weihenstephaner y Schöfferhofer; lagers y pilsners de Hofbräu, Veltins, Flensburger y Mönchshof; bocks como Paulaner Salvator y Weihenstephaner Korbinian, y las cervezas ahumadas de Schlenkerla, de Bamberg. Hay opciones sin alcohol, como Erdinger Alkoholfrei, y barril de Paulaner para tus reuniones. Envío gratis en CDMX y zona metropolitana desde $1,000, con entrega en 24 a 48 horas, y envíos a todo México.",
  },
  inglaterra: {
    meta: "Cerveza inglesa a domicilio: Fuller's, Samuel Smith, St. Peter's, Hobgoblin, Iron Maiden y más. Envío gratis en CDMX desde $1,000.",
    body: "Inglaterra es la cuna de las ales: bitters, porters, stouts y ales de temporada pensadas para tomarse sin prisa. En Cervezaverso encuentras a Fuller's, con su London Pride y su London Porter; las stouts y cervezas de frutas de Samuel Smith; las porters y la cream stout de St. Peter's; la línea Hobgoblin de Wychwood, y cervezas de rock como las de Iron Maiden. También hay opciones sin alcohol, como St. Peter's Without. Envío gratis en CDMX y zona metropolitana desde $1,000, con entrega en 24 a 48 horas, y envíos a todo México.",
  },
  "estados-unidos": {
    meta: "Cerveza de Estados Unidos a domicilio: Sierra Nevada, Belching Beaver, Lagunitas, Firestone Walker y más. Envío gratis en CDMX desde $1,000.",
    body: "Estados Unidos encabezó la revolución de la cerveza artesanal, y sus IPA cargadas de lúpulo cambiaron el gusto de medio mundo. En Cervezaverso tienes a pioneros como Sierra Nevada, con su Pale Ale, la Torpedo y la imperial stout Narwhal; las cervezas de Belching Beaver, incluida la Peanut Butter Milk Stout; Lagunitas, North Coast y Toppling Goliath, y ediciones añejadas en barrica como Parabola, de Firestone Walker. Envío gratis en CDMX y zona metropolitana desde $1,000, con entrega en 24 a 48 horas, y envíos a todo México.",
  },
  italia: {
    meta: "Cerveza italiana a domicilio: Birra Baladin, Peroni y Birra Moretti. Envío gratis en CDMX y zona metropolitana desde $1,000.",
    body: "Italia no solo es vino: su cerveza artesanal es de las más creativas de Europa. En Cervezaverso encuentras a Birra Baladin, una de las pioneras del movimiento artesanal italiano, con cervezas como Nazionale, Isaac, Rock'n'Roll y la añejada Xyauyù, además de lagers clásicas como Peroni y Birra Moretti, ideales con pizza y pasta. Si prefieres sin alcohol, también hay Peroni 0.0. Envío gratis en CDMX y zona metropolitana desde $1,000, con entrega en 24 a 48 horas, y envíos a todo México.",
  },
  espana: {
    meta: "Cerveza española a domicilio: Mahou Maestra Dunkel y Mahou Sin Gluten. Envío gratis en CDMX y zona metropolitana desde $1,000.",
    body: "De Madrid llegan las cervezas de Mahou, una de las cerveceras más tradicionales de España. En Cervezaverso tienes la Mahou Maestra Dunkel, una lager oscura de malta tostada, y Mahou Sin Gluten, una opción para quienes evitan el gluten sin renunciar a una cerveza fresca. Envío gratis en CDMX y zona metropolitana desde $1,000, con entrega en 24 a 48 horas, y envíos a todo México.",
  },
  lituania: {
    meta: "Cerveza lituana a domicilio: Volfas Engelman en IPA, NEIPA, APA, Kriek y Baltic Porter. Envío gratis en CDMX desde $1,000.",
    body: "Lituania tiene una tradición cervecera poco conocida y muy sabrosa. En Cervezaverso traemos a Volfas Engelman, cervecería histórica de Kaunas, con una línea que va de lo ligero a lo intenso: Balta Pinta, de trigo; APA, IPA y NEIPA lupuladas; la Mango Milkshake Pale Ale; la Kriek, de cereza, y la Baltic Porter y la Imperial Porteris para quienes prefieren las oscuras. Envío gratis en CDMX y zona metropolitana desde $1,000, con entrega en 24 a 48 horas, y envíos a todo México.",
  },
  irlanda: {
    meta: "Cerveza irlandesa a domicilio: Guinness Draught en lata, la stout más famosa del mundo. Envío gratis en CDMX desde $1,000.",
    body: "Irlanda es la casa de la stout seca, y Guinness es su embajadora: oscura, cremosa y con notas de café tostado. En Cervezaverso tienes la Guinness Draught en lata, con el sistema que le da su espuma característica al servirla. Sírvela en vaso, de un solo movimiento, y deja que la espuma se asiente antes del primer trago. Envío gratis en CDMX y zona metropolitana desde $1,000, con entrega en 24 a 48 horas, y envíos a todo México.",
  },
  "republica-checa": {
    meta: "Cerveza checa a domicilio: Pilsner Urquell y Kozel, en botella y lata. Envío gratis en CDMX y zona metropolitana desde $1,000.",
    body: "La República Checa inventó la pilsner: en 1842, en la ciudad de Plzeň, nació la Pilsner Urquell, la primera lager dorada de su tipo. En Cervezaverso tienes la Pilsner Urquell en botella y en lata, y las de Kozel: una lager premium y una oscura, de cuerpo ligero y notas de caramelo. Los checos están entre los que más cerveza toman en el mundo, y se nota. Envío gratis en CDMX y zona metropolitana desde $1,000, con entrega en 24 a 48 horas, y envíos a todo México.",
  },
  polonia: {
    meta: "Cerveza polaca a domicilio: Komes Porter Bałtycki, Imperial Stout y Barley Wine. Envío gratis en CDMX y zona metropolitana desde $1,000.",
    body: "Polonia es experta en porter báltico, una cerveza oscura, fuerte y suave a la vez. En Cervezaverso tienes las de Komes: la Porter Bałtycki, su versión con madera de amburana, una Imperial Stout y una Barley Wine. Son cervezas para tomar con calma, no tan frías, y acompañar con postres o quesos maduros. Envío gratis en CDMX y zona metropolitana desde $1,000, con entrega en 24 a 48 horas, y envíos a todo México.",
  },
  francia: {
    meta: "Cerveza francesa a domicilio: Brasserie du Mont Blanc La Blanche y La Blonde. Envío gratis en CDMX y zona metropolitana desde $1,000.",
    body: "Desde los Alpes franceses llega la Brasserie du Mont Blanc, que elabora sus cervezas con agua de montaña. En Cervezaverso tienes La Blanche, una cerveza de trigo fresca y ligeramente especiada, y La Blonde, una rubia equilibrada, las dos en botella chica y grande. Son una buena puerta de entrada a la cerveza europea para quien busca algo ligero. Envío gratis en CDMX y zona metropolitana desde $1,000, con entrega en 24 a 48 horas, y envíos a todo México.",
  },
};

export const STYLE_CONTENT: Record<string, CategoryContent> = {
  stout: {
    meta: "Cerveza stout a domicilio: Guinness, Samuel Smith, Rámuri, Calavera, Sierra Nevada Narwhal y más. Envío gratis en CDMX desde $1,000.",
    body: "La stout es una cerveza oscura de malta tostada, con notas de café, chocolate y caramelo. Va de la seca y ligera, como la Guinness, a las imperial stouts de más de 10% de alcohol. En Cervezaverso tienes clásicas como Samuel Smith y St. Peter's; mexicanas como Rámuri Lágrimas Negras, Calavera y Wendlandt Foca Parlante, y joyas como Sierra Nevada Narwhal, North Coast Old Rasputin y Firestone Walker Parabola. Envío gratis en CDMX y zona metropolitana desde $1,000, con entrega en 24 a 48 horas, y envíos a todo México.",
  },
  ipa: {
    meta: "Cerveza IPA a domicilio: Sierra Nevada Torpedo, BrewDog Hazy Jane, Belching Beaver, Wendlandt Perro del Mar y más. Envío gratis en CDMX desde $1,000.",
    body: "La IPA es la cerveza del lúpulo: aromas cítricos, tropicales o de pino y un amargor que la distingue. Hay West Coast, más secas y amargas; hazy o NEIPA, turbias y jugosas, y session IPA, más ligeras. En Cervezaverso tienes Sierra Nevada Torpedo, BrewDog Hazy Jane, Belching Beaver Tropical Terps, Lagunitas y Volfas Engelman NEIPA, y mexicanas como Wendlandt Perro del Mar, Rey Árbol y Monkey Waves. Tómala fresca: el lúpulo pierde aroma con el tiempo. Envío gratis en CDMX y zona metropolitana desde $1,000, con entrega en 24 a 48 horas, y envíos a todo México.",
  },
  lager: {
    meta: "Cerveza lager a domicilio: Asahi, Peroni, Tsingtao, Grolsch, Baltika y más, de todo el mundo. Envío gratis en CDMX desde $1,000.",
    body: "La lager es la cerveza más tomada del mundo: fermentación baja, maduración en frío y un sabor limpio y refrescante. En Cervezaverso reunimos lagers de muchos países: Asahi de Japón, Tsingtao de China, Peroni y Birra Moretti de Italia, Grolsch de Países Bajos, Baltika de Rusia, Flensburger de Alemania y Palma Cristal de Cuba, además de mexicanas como Jabalí Salvajita y Del Llano Gambeta. Son ideales para acompañar comida y para quien empieza a explorar. Envío gratis en CDMX y zona metropolitana desde $1,000, con entrega en 24 a 48 horas, y envíos a todo México.",
  },
  pilsner: {
    meta: "Cerveza pilsner a domicilio: Pilsner Urquell, Veltins, Flensburger, Weihenstephaner Pils y más. Envío gratis en CDMX desde $1,000.",
    body: "La pilsner es una lager rubia nacida en 1842 en Plzeň, República Checa: cristalina, de cuerpo ligero y con un amargor de lúpulo que la hace muy refrescante. En Cervezaverso tienes la original, Pilsner Urquell; versiones alemanas como Veltins, Flensburger, Weihenstephaner Pils y Mönchshof; la Sierra Nevada Pils, de Estados Unidos, y propuestas mexicanas como Rey Árbol Olivo. Sírvela bien fría y en vaso alto. Envío gratis en CDMX y zona metropolitana desde $1,000, con entrega en 24 a 48 horas, y envíos a todo México.",
  },
  porter: {
    meta: "Cerveza porter a domicilio: Fuller's London Porter, St. Peter's, Komes, Volfas Engelman y más. Envío gratis en CDMX desde $1,000.",
    body: "La porter nació en Londres en el siglo XVIII y fue la cerveza de los cargadores del puerto: oscura, de malta tostada, con notas de chocolate y café, y más ligera que una stout. En Cervezaverso tienes la clásica Fuller's London Porter; las de St. Peter's, Old Style y Honey Porter, y porters bálticas, más fuertes, de Komes, Volfas Engelman y Baltika. Combínala con carnes asadas, mole o un postre de chocolate. Envío gratis en CDMX y zona metropolitana desde $1,000, con entrega en 24 a 48 horas, y envíos a todo México.",
  },
  trigo: {
    meta: "Cerveza de trigo a domicilio: Paulaner, Erdinger, Weihenstephaner, Schöfferhofer, Blue Moon y más. Envío gratis en CDMX desde $1,000.",
    body: "La cerveza de trigo es suave, turbia y muy refrescante. Las weissbier alemanas tienen notas de plátano y clavo, y las witbier, al estilo belga, llevan cáscara de naranja y cilantro. En Cervezaverso tienes Paulaner, Erdinger, Weihenstephaner, Hofbräu, Kapuziner y Schöfferhofer, con versiones oscuras (dunkel) y con toronja, además de Blue Moon y La Blanche, de Mont Blanc. Para fiestas, hay barril de Paulaner Weissbier. Envío gratis en CDMX y zona metropolitana desde $1,000, con entrega en 24 a 48 horas, y envíos a todo México.",
  },
  "pale-ale": {
    meta: "Cerveza pale ale a domicilio: Sierra Nevada Pale Ale, Baladin Rock'n'Roll, Wendlandt Vaquita Marina y más. Envío gratis en CDMX desde $1,000.",
    body: "La pale ale es el punto de equilibrio entre malta y lúpulo: dorada o ámbar, aromática y fácil de tomar. Es la mejor puerta de entrada a las cervezas lupuladas antes de pasar a una IPA. En Cervezaverso tienes la Sierra Nevada Pale Ale, que inspiró a miles de cervecerías artesanales, y opciones como Baladin Rock'n'Roll, Volfas Engelman APA, Vocation, Toppling Goliath Pseudo Sue y mexicanas como Wendlandt Vaquita Marina e Insurgente Xavi. Envío gratis en CDMX y zona metropolitana desde $1,000, con entrega en 24 a 48 horas, y envíos a todo México.",
  },
  belga: {
    meta: "Cervezas de estilo belga a domicilio: Duvel, Delirium Tremens, Chouffe, Gulden Draak, Westvleteren 12 y más. Envío gratis en CDMX desde $1,000.",
    body: "Los estilos belgas se distinguen por sus levaduras, que dan notas frutales y especiadas: dubbel, tripel, quadrupel y strong ale, muchas con más de 8% de alcohol. En Cervezaverso tienes Duvel y su Tripel Hop, Delirium Tremens, La Chouffe y Mc Chouffe, Gulden Draak, Kasteel, Carolus, Straffe Hendrik y Brugse Zot, la legendaria Westvleteren 12, y versiones hechas fuera de Bélgica, como Blue Moon y North Coast Brother Thelonious. Sírvelas en copa y no tan frías. Envío gratis en CDMX y zona metropolitana desde $1,000, con entrega en 24 a 48 horas, y envíos a todo México.",
  },
  bock: {
    meta: "Cerveza bock a domicilio: Paulaner Salvator, Weihenstephaner Korbinian, Samichlaus, Tucher Bajuvator y más. Envío gratis en CDMX desde $1,000.",
    body: "La bock es una lager alemana fuerte y maltosa, con notas de pan tostado, caramelo y frutos secos; la doppelbock es su versión todavía más intensa. En Cervezaverso tienes clásicas como Paulaner Salvator, Weihenstephaner Korbinian y Tucher Bajuvator, la Mönchshof Bockbier, la Maisel & Friends Chocolate Bock y la Samichlaus, que se elabora solo una vez al año, el 6 de diciembre. Son ideales para el frío y para acompañar carnes y quesos. Envío gratis en CDMX y zona metropolitana desde $1,000, con entrega en 24 a 48 horas, y envíos a todo México.",
  },
  "lambic-y-sour": {
    meta: "Cerveza lambic y sour a domicilio: Lindemans Framboise, Pêcheresse, Kriek y más. Envío gratis en CDMX y zona metropolitana desde $1,000.",
    body: "Las lambic son cervezas belgas de fermentación espontánea, con levaduras silvestres del ambiente, y las sour son cervezas de acidez marcada y refrescante; muchas se maceran con fruta. En Cervezaverso tienes las de Lindemans, de frambuesa, durazno (Pêcheresse), manzana y fresa, incluidas versiones 0.0; la Volfas Engelman Kriek, de cereza, y la Santa Sabina Rosalía, una sour mexicana con frambuesa. Sírvelas bien frías, en copa, como aperitivo o con postres. Envío gratis en CDMX y zona metropolitana desde $1,000, con entrega en 24 a 48 horas, y envíos a todo México.",
  },
  frutales: {
    meta: "Cerveza de frutas a domicilio: Kasteel Rouge, Delirium Red, Chouffe Cherry, Samuel Smith y Boscoli. Envío gratis en CDMX desde $1,000.",
    body: "Las cervezas de frutas combinan la base de una cerveza con cereza, frambuesa, durazno u otras frutas, y van de las dulces y ligeras a las intensas y complejas. En Cervezaverso tienes Kasteel Rouge, Delirium Red y Chouffe Cherry, de Bélgica; las de Samuel Smith, de Inglaterra, de chabacano, cereza, frambuesa y fresa; las Boscoli, y opciones como Kasteel Tropical, también en versión 0.0. Son buena elección para quien no es fan de lo amargo. Envío gratis en CDMX y zona metropolitana desde $1,000, con entrega en 24 a 48 horas, y envíos a todo México.",
  },
  "sin-alcohol": {
    meta: "Cerveza sin alcohol a domicilio: Erdinger Alkoholfrei, Lindemans 0.0, Paranoia Alcohol Free y más. Envío gratis en CDMX desde $1,000.",
    body: "Si quieres el sabor de una buena cerveza sin el alcohol, aquí tienes opciones para cada gusto. En Cervezaverso hay Erdinger Alkoholfrei, una cerveza de trigo alemana; la Kriek y la Pêcheresse 0.0 de Lindemans, frutales belgas, y Paranoia Alcohol Free, entre otras. Son ideales para entre semana o cuando quieres algo refrescante con la comida. Envío gratis en CDMX y zona metropolitana desde $1,000, con entrega en 24 a 48 horas, y envíos a todo México.",
  },
};

/** «Cerveza de Bélgica» → «Sobre la cerveza de Bélgica». */
export function categorySectionTitle(heading: string): string {
  return `Sobre la ${heading.charAt(0).toLowerCase()}${heading.slice(1)}`;
}
