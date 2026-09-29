import "server-only";
import fs from "node:fs";
import path from "node:path";

const PUBLIC_DIR = path.join(process.cwd(), "public");
const IMAGE_EXTENSIONS = new Set([".png", ".jpg", ".jpeg", ".webp", ".avif", ".svg"]);
const VIDEO_EXTENSIONS = new Set([".mp4", ".webm"]);

/**
 * Lista los archivos de una carpeta dentro de `public/` y devuelve sus URLs
 * públicas ordenadas por nombre. Si la carpeta no existe devuelve `[]`, así que
 * basta con soltar archivos en la carpeta para que aparezcan en el sitio.
 */
function listPublicFiles(dir: string, extensions: Set<string>): string[] {
  const absoluteDir = path.join(PUBLIC_DIR, dir);
  let entries: fs.Dirent[];
  try {
    entries = fs.readdirSync(absoluteDir, { withFileTypes: true });
  } catch {
    return [];
  }

  return entries
    .filter((entry) => entry.isFile() && extensions.has(path.extname(entry.name).toLowerCase()))
    .map((entry) => entry.name)
    .sort((a, b) => a.localeCompare(b, "es", { numeric: true }))
    .map((name) => `/${path.posix.join(dir.split(path.sep).join("/"), name)}`);
}

export function listPublicImages(dir: string): string[] {
  return listPublicFiles(dir, IMAGE_EXTENSIONS);
}

export function listPublicVideos(dir: string): string[] {
  return listPublicFiles(dir, VIDEO_EXTENSIONS);
}

/** ¿Existe `public/<file>`? Para medios opcionales (p. ej. el video del Hero). */
export function publicFileExists(file: string): boolean {
  try {
    return fs.statSync(path.join(PUBLIC_DIR, file)).isFile();
  } catch {
    return false;
  }
}

/** Carpetas de `public/` que alimentan la identidad visual. */
export const MEDIA_DIRS = {
  /** Tarros recortados (sin fondo): logo del header y slides del Hero. */
  tarros: "img/cervezaverso-tarros-sin-fondo/tarros-sin-fondo",
  /** Capas de tarro alineadas al marco circular (1024×1024). */
  capasCirculares: "img/cervezaverso-logos-v2/capas-tarro/circular",
  marcoCircular: "img/cervezaverso-logos-v2/marcos/marco-circular.png",
  /** Video principal del Hero (opcional). Si no existe se usa `heroVideos`. */
  heroVideo: "hero-beer.mp4",
  /** Videos de fondo del Hero (opcional: .mp4/.webm). */
  heroVideos: "video/hero",
} as const;
