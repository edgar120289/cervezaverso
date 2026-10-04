"use client";

import { useState, useTransition } from "react";
import { Loader2, Save } from "lucide-react";
import { guardarLanding } from "@/app/actions/admin-landing";
import { HERO_INTERVALS, type HeroSettings } from "@/lib/hero";
import type { LandingModule, LandingSettings } from "@/lib/landing";
import HeroBannerList from "./HeroBannerList";
import HeroCtaEditor from "./HeroCtaEditor";
import HeroTextFields from "./HeroTextFields";
import LandingModulesEditor from "./LandingModulesEditor";
import Switch from "./Switch";

const sectionClass = "space-y-4 rounded-[28px] bg-white p-6 shadow-card";

function segmentClass(active: boolean) {
  return `min-h-11 rounded-full px-5 text-sm font-semibold transition-colors ${
    active ? "bg-black text-white" : "bg-canvas text-black/65 hover:bg-black/10 hover:text-black"
  }`;
}

/** Centro de control de la landing: Hero (video o carrusel, textos, banners y botones) y 3 bloques modulares. */
export default function LandingForm({ initial }: { initial: LandingSettings }) {
  const [saved, setSaved] = useState(initial);
  const [landing, setLanding] = useState(initial);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const settings = landing.hero;
  const isDirty = JSON.stringify(landing) !== JSON.stringify(saved);

  function update(patch: Partial<HeroSettings>) {
    setNotice(null);
    setLanding((current) => ({ ...current, hero: { ...current.hero, ...patch } }));
  }

  function updateModules(modules: LandingModule[]) {
    setNotice(null);
    setLanding((current) => ({ ...current, modules }));
  }

  function handleSave() {
    setError(null);
    setNotice(null);
    startTransition(async () => {
      const result = await guardarLanding(landing);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setSaved(landing);
      setNotice("Cambios guardados. Ya se ven en la tienda.");
    });
  }

  return (
    <div className="space-y-6">
      <section className={sectionClass}>
        <Switch
          checked={settings.is_hero_active}
          onChange={(value) => update({ is_hero_active: value })}
          label="Mostrar el Hero en la tienda"
          description="Apagado, la portada empieza directamente en el catálogo."
        />
      </section>

      <section className={sectionClass} aria-labelledby="hero-type">
        <h2 id="hero-type" className="font-semibold tracking-tight">
          Tipo de Hero
        </h2>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            aria-pressed={settings.hero_type === "video"}
            onClick={() => update({ hero_type: "video" })}
            className={segmentClass(settings.hero_type === "video")}
          >
            Video
          </button>
          <button
            type="button"
            aria-pressed={settings.hero_type === "carousel"}
            onClick={() => update({ hero_type: "carousel" })}
            className={segmentClass(settings.hero_type === "carousel")}
          >
            Carrusel de banners
          </button>
        </div>
      </section>

      {settings.hero_type === "video" ? (
        <section className={sectionClass} aria-labelledby="hero-video">
          <h2 id="hero-video" className="font-semibold tracking-tight">
            Video
          </h2>
          <label className="block text-xs font-semibold uppercase tracking-wide text-muted">
            URL del video
            <input
              type="text"
              value={settings.hero_video_url ?? ""}
              maxLength={500}
              onChange={(e) => update({ hero_video_url: e.target.value })}
              placeholder="Opcional"
              className="mt-1 min-h-11 w-full rounded-full bg-canvas px-4 text-sm font-normal normal-case tracking-normal text-black outline-none focus:ring-2 focus:ring-black/15"
            />
            <span className="mt-1 block text-[11px] font-normal normal-case tracking-normal">
              Ruta del sitio (por ejemplo, /video/hero/mi-video.mp4) o URL https:// de Supabase Storage.
            </span>
          </label>
          <HeroTextFields
            title={settings.hero_video_title ?? ""}
            subtitle={settings.hero_video_subtitle ?? ""}
            onTitleChange={(hero_video_title) => update({ hero_video_title })}
            onSubtitleChange={(hero_video_subtitle) => update({ hero_video_subtitle })}
          />
          <HeroCtaEditor
            label="Video"
            ctas={settings.hero_video_ctas}
            onChange={(hero_video_ctas) => update({ hero_video_ctas })}
          />
        </section>
      ) : (
        <section className={sectionClass} aria-labelledby="hero-carousel">
          <h2 id="hero-carousel" className="font-semibold tracking-tight">
            Carrusel
          </h2>
          <fieldset>
            <legend className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
              Velocidad de rotación
            </legend>
            <div className="flex flex-wrap gap-2">
              {HERO_INTERVALS.map((seconds) => (
                <button
                  key={seconds}
                  type="button"
                  aria-pressed={settings.hero_carousel_interval_seconds === seconds}
                  onClick={() => update({ hero_carousel_interval_seconds: seconds })}
                  className={segmentClass(settings.hero_carousel_interval_seconds === seconds)}
                >
                  {seconds} s
                </button>
              ))}
            </div>
          </fieldset>
          <HeroBannerList banners={settings.hero_banners} onChange={(hero_banners) => update({ hero_banners })} />
        </section>
      )}

      <LandingModulesEditor modules={landing.modules} onChange={updateModules} />

      <div className="sticky bottom-4 z-10 flex flex-col gap-2 rounded-[28px] bg-white p-4 shadow-card sm:flex-row sm:items-center sm:justify-between">
        <div aria-live="polite" className="text-sm">
          {error && <p className="text-danger">{error}</p>}
          {notice && <p className="text-black/70">{notice}</p>}
          {!error && !notice && isDirty && <p className="text-muted">Tienes cambios sin guardar.</p>}
        </div>
        <button
          type="button"
          onClick={handleSave}
          disabled={isPending || !isDirty}
          className="flex min-h-12 items-center justify-center gap-2 rounded-full bg-accent px-6 text-sm font-semibold text-white shadow-accent transition-transform active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50"
        >
          {isPending ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          {isPending ? "Guardando…" : "Guardar cambios"}
        </button>
      </div>
    </div>
  );
}
