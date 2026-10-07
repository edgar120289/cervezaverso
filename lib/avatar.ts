import { z } from "zod";

export const AVATAR_BUCKET = "avatars";
export const AVATAR_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"];
const MAX_AVATAR_BYTES = 2 * 1024 * 1024;

export const avatarFileSchema = z
  .instanceof(File, { message: "No se eligió ninguna imagen." })
  .refine((file) => AVATAR_TYPES.includes(file.type), "La foto debe ser JPG, PNG, WebP o AVIF.")
  .refine((file) => file.size > 0, "La imagen está vacía.")
  .refine((file) => file.size <= MAX_AVATAR_BYTES, "La foto supera los 2 MB.");

/** Prefijo público que debe tener la URL de la foto de un usuario; evita guardar enlaces ajenos. */
export function avatarUrlPrefix(supabaseUrl: string, userId: string): string {
  return `${supabaseUrl.replace(/\/$/, "")}/storage/v1/object/public/${AVATAR_BUCKET}/${userId}/`;
}
