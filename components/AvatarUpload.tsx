"use client";

import { useRef, useState, useTransition, type ChangeEvent } from "react";
import Image from "next/image";
import { Camera, Loader2, UserRound } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { guardarAvatar } from "@/app/actions/cuenta";
import { AVATAR_BUCKET, AVATAR_TYPES, avatarFileSchema } from "@/lib/avatar";
import { firstIssue } from "@/lib/validation";

/** Sube la foto al bucket «avatars» (carpeta del propio usuario, por RLS) y guarda su URL en el perfil. */
export default function AvatarUpload({ userId, current }: { userId: string; current: string | null }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [url, setUrl] = useState<string | null>(current);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, startTransition] = useTransition();
  const busy = uploading || saving;

  async function handleFile(e: ChangeEvent<HTMLInputElement>) {
    setError(null);
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    const parsed = avatarFileSchema.safeParse(file);
    if (!parsed.success) {
      setError(firstIssue(parsed.error));
      return;
    }

    setUploading(true);
    try {
      const supabase = createClient();
      const extension = file.type.split("/")[1];
      const path = `${userId}/${crypto.randomUUID()}.${extension}`;
      const { error: uploadError } = await supabase.storage
        .from(AVATAR_BUCKET)
        .upload(path, file, { contentType: file.type, cacheControl: "31536000", upsert: false });
      if (uploadError) throw uploadError;

      const publicUrl = supabase.storage.from(AVATAR_BUCKET).getPublicUrl(path).data.publicUrl;
      startTransition(async () => {
        const { ok } = await guardarAvatar(publicUrl);
        if (ok) setUrl(publicUrl);
        else setError("No pudimos guardar tu foto. Inténtalo de nuevo.");
      });
    } catch {
      setError("No pudimos subir tu foto. Inténtalo de nuevo.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="flex items-center gap-4">
      <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-full bg-white shadow-card">
        {url ? (
          <Image src={url} alt="Tu foto de perfil" fill sizes="80px" className="object-cover" />
        ) : (
          <span className="flex h-full w-full items-center justify-center text-muted">
            <UserRound size={32} aria-hidden />
          </span>
        )}
      </div>
      <div className="space-y-1">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          className="flex min-h-11 items-center gap-2 rounded-full bg-ink px-5 text-sm font-semibold text-white disabled:opacity-60"
        >
          {busy ? <Loader2 size={16} className="animate-spin" aria-hidden /> : <Camera size={16} aria-hidden />}
          {busy ? "Guardando…" : url ? "Cambiar foto" : "Subir foto"}
        </button>
        <p className="text-xs text-muted">JPG, PNG, WebP o AVIF · máximo 2 MB</p>
        <div aria-live="polite">{error && <p className="text-sm text-danger">{error}</p>}</div>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={AVATAR_TYPES.join(",")}
        onChange={handleFile}
        className="sr-only"
        tabIndex={-1}
        aria-label="Foto de perfil"
      />
    </div>
  );
}
