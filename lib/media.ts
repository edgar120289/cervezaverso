import "server-only";
import fs from "node:fs";
import path from "node:path";

const PUBLIC_DIR = path.join(process.cwd(), "public");
const IMAGE_EXTENSIONS = new Set([".png", ".jpg", ".jpeg", ".webp", ".avif", ".svg"]);

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

export { MEDIA_DIRS } from "./media-paths";
