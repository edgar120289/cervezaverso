import "server-only";

/**
 * Publicación en Instagram y Facebook con la API Graph de Meta.
 * `META_ACCESS_TOKEN`: token de un usuario del sistema (Business Manager) con instagram_basic,
 * instagram_content_publish, pages_show_list, pages_read_engagement y pages_manage_posts.
 * La página y la cuenta de Instagram se descubren solas con /me/accounts (o `META_PAGE_ID` si hay varias).
 * Instagram exige imágenes JPG en una URL pública.
 */

const VERSION = process.env.META_GRAPH_VERSION?.trim() || "v23.0";
const GRAPH = `https://graph.facebook.com/${VERSION}`;

export class MetaError extends Error {}

type Params = Record<string, string>;

async function graph<T>(method: "GET" | "POST", path: string, params: Params, token: string): Promise<T> {
  const body = new URLSearchParams({ ...params, access_token: token });
  const url = method === "GET" ? `${GRAPH}/${path}?${body}` : `${GRAPH}/${path}`;
  const res = await fetch(url, {
    method,
    ...(method === "POST" ? { body, headers: { "content-type": "application/x-www-form-urlencoded" } } : {}),
    cache: "no-store",
  });
  const data = (await res.json().catch(() => ({}))) as T & { error?: { message?: string; code?: number } };
  if (!res.ok || data.error) {
    throw new MetaError(data.error?.message ? `Meta: ${data.error.message}` : `Meta respondió ${res.status}.`);
  }
  return data;
}

export type MetaCuenta = { pageId: string; pageName: string; pageToken: string; igId: string | null; igUsername: string | null };

export function metaConfigurado(): boolean {
  return Boolean(process.env.META_ACCESS_TOKEN);
}

/** Página de Facebook (con su token) y cuenta de Instagram ligada. */
export async function cuentaMeta(): Promise<MetaCuenta> {
  const token = process.env.META_ACCESS_TOKEN;
  if (!token) throw new MetaError("Falta META_ACCESS_TOKEN en Vercel.");
  const { data } = await graph<{
    data: { id: string; name: string; access_token: string; instagram_business_account?: { id: string; username?: string } }[];
  }>("GET", "me/accounts", { fields: "id,name,access_token,instagram_business_account{id,username}" }, token);
  const wanted = process.env.META_PAGE_ID?.trim();
  const page = (wanted ? data.find((p) => p.id === wanted) : null) ?? data[0];
  if (!page) throw new MetaError("El token no tiene acceso a ninguna página de Facebook.");
  return {
    pageId: page.id,
    pageName: page.name,
    pageToken: page.access_token,
    igId: page.instagram_business_account?.id ?? null,
    igUsername: page.instagram_business_account?.username ?? null,
  };
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** Espera a que Instagram termine de procesar un contenedor (las imágenes tardan unos segundos). */
async function esperarContenedor(id: string, token: string) {
  for (let i = 0; i < 10; i++) {
    const { status_code } = await graph<{ status_code?: string }>("GET", id, { fields: "status_code" }, token);
    if (status_code === "FINISHED" || status_code === undefined) return;
    if (status_code === "ERROR" || status_code === "EXPIRED") throw new MetaError(`Instagram no pudo procesar la imagen (${status_code}).`);
    await sleep(2000);
  }
  throw new MetaError("Instagram tardó demasiado en procesar las imágenes.");
}

/** Publica una imagen o un carrusel (2 a 10) en Instagram. Devuelve el id de la publicación. */
export async function publicarInstagram(cuenta: MetaCuenta, imagenes: string[], caption: string): Promise<string> {
  if (!cuenta.igId) throw new MetaError("La página de Facebook no tiene una cuenta de Instagram profesional ligada.");
  const token = cuenta.pageToken;
  let creationId: string;
  if (imagenes.length === 1) {
    ({ id: creationId } = await graph<{ id: string }>("POST", `${cuenta.igId}/media`, { image_url: imagenes[0], caption }, token));
  } else {
    const children: string[] = [];
    for (const image_url of imagenes) {
      const { id } = await graph<{ id: string }>("POST", `${cuenta.igId}/media`, { image_url, is_carousel_item: "true" }, token);
      children.push(id);
    }
    for (const id of children) await esperarContenedor(id, token);
    ({ id: creationId } = await graph<{ id: string }>(
      "POST",
      `${cuenta.igId}/media`,
      { media_type: "CAROUSEL", children: children.join(","), caption },
      token,
    ));
  }
  await esperarContenedor(creationId, token);
  const { id } = await graph<{ id: string }>("POST", `${cuenta.igId}/media_publish`, { creation_id: creationId }, token);
  return id;
}

/** Publica en la página de Facebook: una foto o varias en una sola publicación. */
export async function publicarFacebook(cuenta: MetaCuenta, imagenes: string[], message: string): Promise<string> {
  const token = cuenta.pageToken;
  if (imagenes.length === 1) {
    const { post_id, id } = await graph<{ id: string; post_id?: string }>(
      "POST",
      `${cuenta.pageId}/photos`,
      { url: imagenes[0], message },
      token,
    );
    return post_id ?? id;
  }
  const media: string[] = [];
  for (const url of imagenes) {
    const { id } = await graph<{ id: string }>("POST", `${cuenta.pageId}/photos`, { url, published: "false" }, token);
    media.push(id);
  }
  const attached = Object.fromEntries(media.map((id, i) => [`attached_media[${i}]`, JSON.stringify({ media_fbid: id })]));
  const { id } = await graph<{ id: string }>("POST", `${cuenta.pageId}/feed`, { message, ...attached }, token);
  return id;
}
