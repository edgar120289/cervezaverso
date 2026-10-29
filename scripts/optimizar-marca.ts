/**
 * Genera las WebP de la identidad de marca (tarros, capas circulares, marcos y mascota)
 * a 160 y 480 px de ancho, con transparencia, en public/img/optimizadas/<carpeta>/<nombre>-<ancho>.webp.
 * Los PNG originales no se tocan (se siguen usando para redes).
 *
 * Uso: npm run optimizar:marca
 */
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { BRAND_WIDTHS, MASCOT_FILE, MEDIA_DIRS, OPTIMIZED_DIR } from "../lib/media-paths";

const PUBLIC_DIR = path.join(process.cwd(), "public");
const QUALITY = 80;

function pngsIn(dir: string): string[] {
  return fs
    .readdirSync(path.join(PUBLIC_DIR, dir))
    .filter((name) => name.toLowerCase().endsWith(".png"))
    .map((name) => path.posix.join(dir, name));
}

const sources = new Set<string>([
  ...pngsIn(MEDIA_DIRS.tarros),
  ...pngsIn(MEDIA_DIRS.capasCirculares),
  MEDIA_DIRS.marcoCircular,
  MEDIA_DIRS.marcoHorizontal,
  MASCOT_FILE,
]);

let before = 0;
let after = 0;

async function main() {
  for (const file of [...sources].sort()) {
    const parts = file.split("/");
    const folder = parts[parts.length - 2];
    const name = path.posix.basename(file, ".png");
    const input = path.join(PUBLIC_DIR, file);
    const outDir = path.join(PUBLIC_DIR, OPTIMIZED_DIR, folder);
    fs.mkdirSync(outDir, { recursive: true });
    before += fs.statSync(input).size;

    for (const width of Object.values(BRAND_WIDTHS)) {
      const output = path.join(outDir, `${name}-${width}.webp`);
      await sharp(input)
        .resize({ width, withoutEnlargement: true })
        .webp({ quality: QUALITY, alphaQuality: 100 })
        .toFile(output);
      after += fs.statSync(output).size;
    }
  }

  const kb = (bytes: number) => `${(bytes / 1024).toFixed(0)} KB`;
  console.log(`${sources.size} PNG (${kb(before)}) → ${sources.size * 2} WebP (${kb(after)}) en public/${OPTIMIZED_DIR}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
