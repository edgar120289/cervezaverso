import "server-only";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { SITE } from "@/lib/site";

const LOGO_URL = `${SITE.url}/img/email/logo-cervezaverso.png`;
let logoDataUri: Promise<string> | null = null;

/**
 * La vista previa del panel va en un iframe con sandbox (origen opaco): la CSP heredada
 * no permite imágenes de nuestro dominio, pero sí `data:`. Solo para la vista previa;
 * el correo real conserva la URL pública.
 */
export async function conLogoEmbebido(html: string): Promise<string> {
  logoDataUri ??= readFile(join(process.cwd(), "assets", "email", "logo-cervezaverso.png")).then(
    (b) => `data:image/png;base64,${b.toString("base64")}`,
  );
  try {
    return html.replaceAll(LOGO_URL, await logoDataUri);
  } catch {
    logoDataUri = null;
    return html;
  }
}
