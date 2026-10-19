"use client";

import { useEffect, useState, useTransition } from "react";
import { Loader2, Save } from "lucide-react";
import { guardarLanding, obtenerProductosDestacados } from "@/app/actions/admin-landing";
import { LandingModuleView } from "@/components/landing/LandingModules";
import StyledBanner from "@/components/landing/StyledBanner";
import { HERO_INTERVALS, type HeroBanner, type HeroSettings } from "@/lib/hero";
import { collectSpotlightRefs, type LandingModule, type LandingSettings } from "@/lib/landing";
import { spotlightRef, type BlockStyle } from "@/lib/landing-style";
import type { Product } from "@/lib/types";
import BlockEditor from "./BlockEditor";
import HeroBannerList from "./HeroBannerList";
import HeroCtaEditor from "./HeroCtaEditor";
import HeroTextFields from "./HeroTextFields";
import { ModuleEditor } from "./LandingModulesEditor";
import StudioCanvas, { type StudioDevice } from "./StudioCanvas";
import Switch from "./Switch";

type Target = "hero" | LandingModule["id"];

const TARGET_LABELS: Record<Target, string> = {
  hero: "Hero",
  split: "Dividido",
  impact: "Impacto",
  grid: "Cuadrícula",
};

const HERO_FEATURES = { subtitle: true, layout: true, overlay: true, spotlight: true } as const;

function segmentClass(active: boolean) {
  return `min-h-11 rounded-full px-5 text-sm font-semibold transition-colors ${
    active ? "bg-black text-white" : "bg-canvas text-black/65 hover:bg-black/10 hover:text-black"
  }`;
}

const inputClass =
  "mt-1 min-h-11 w-full rounded-full bg-canvas px-4 text-sm font-normal normal-case tracking-normal text-black outline-none focus:ring-2 focus:ring-black/15";

/**
 * Studio de la landing: a la izquierda las secciones de edición del elemento elegido (Hero o uno de los 3 bloques),
 * al centro el lienzo con la vista previa real en escritorio o móvil. Guardar publica todo de una vez.
 */
export default function LandingForm({ initial }: { initial: LandingSettings }) {
  const [saved, setSaved] = useState(initial);
  const [landing, setLanding] = useState(initial);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [lookup, setLookup] = useState<Record<string, Product | null>>({});
  const [target, setTarget] = useState<Target>("hero");
  const [bannerIndex, setBannerIndex] = useState(0);
  const [device, setDevice] = useState<StudioDevice>("desktop");

  const settings = landing.hero;
  const isDirty = JSON.stringify(landing) !== JSON.stringify(saved);
  const banners = settings.hero_banners;
  const activeBanner = Math.min(bannerIndex, banners.length - 1);

  const refs = collectSpotlightRefs(landing);
  const refsKey = refs.join("|");
  const products = Object.fromEntries(
    Object.entries(lookup).filter((entry): entry is [string, Product] => entry[1] !== null),
  );
  const productsLoading = refs.some((ref) => !(ref in lookup));

  // Resuelve las cervezas destacadas para las vistas previas; espera a que se deje de escribir el SKU.
  useEffect(() => {
    const missing = refsKey ? refsKey.split("|").filter((ref) => !(ref in lookup)) : [];
    if (missing.length === 0) return;
    const timer = window.setTimeout(() => {
      obtenerProductosDestacados(missing).then(
        (found) =>
          setLookup((current) => ({ ...current, ...Object.fromEntries(missing.map((ref) => [ref, found[ref] ?? null])) })),
        () => setLookup((current) => ({ ...current, ...Object.fromEntries(missing.map((ref) => [ref, null])) })),
      );
    }, 400);
    return () => window.clearTimeout(timer);
  }, [refsKey, lookup]);

  function update(patch: Partial<HeroSettings>) {
    setNotice(null);
    setLanding((current) => ({ ...current, hero: { ...current.hero, ...patch } }));
  }

  function updateBanner(index: number, patch: Partial<HeroBanner>) {
    update({ hero_banners: banners.map((banner, i) => (i === index ? { ...banner, ...patch } : banner)) });
  }

  function patchModule(id: LandingModule["id"], changes: Partial<LandingModule>) {
    setNotice(null);
    setLanding((current) => ({
      ...current,
      modules: current.modules.map((item) => (item.id === id ? ({ ...item, ...changes } as LandingModule) : item)),
    }));
  }

  function changeOrder(id: LandingModule["id"], order: LandingModule["order"]) {
    setNotice(null);
    setLanding((current) => {
      const moving = current.modules.find((item) => item.id === id);
      if (!moving) return current;
      return {
        ...current,
        modules: current.modules.map((block) => {
          if (block.id === id) return { ...block, order };
          if (block.order === order) return { ...block, order: moving.order };
          return block;
        }),
      };
    });
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

  function productFor(style: BlockStyle) {
    const ref = spotlightRef(style);
    return ref ? (products[ref] ?? null) : null;
  }

  const block = target === "hero" ? null : landing.modules.find((item) => item.id === target);
  const isVideo = settings.hero_type === "video";

  let preview: React.ReactNode = null;
  if (block) {
    preview = (
      <>
        {!block.enabled && <p className="mb-2 text-xs text-muted">Apagado: no se muestra en la tienda.</p>}
        <div className={block.enabled ? "" : "opacity-50"}>
          <LandingModuleView module={block} preview products={products} />
        </div>
      </>
    );
  } else if (isVideo) {
    preview = (
      <StyledBanner
        headingTag="div"
        title={settings.hero_video_title}
        subtitle={settings.hero_video_subtitle}
        ctas={settings.hero_video_ctas}
        style={settings.hero_video_style}
        product={productFor(settings.hero_video_style)}
        tall={Boolean(productFor(settings.hero_video_style))}
      />
    );
  } else if (banners[activeBanner]) {
    const banner = banners[activeBanner];
    preview = (
      <StyledBanner
        headingTag="div"
        title={banner.title}
        subtitle={banner.subtitle}
        ctas={banner.ctas}
        style={banner.style}
        imageUrl={banner.image_url}
        imageAlt={banner.alt}
        product={productFor(banner.style)}
        tall={banners.some((item) => Boolean(productFor(item.style)))}
      />
    );
  } else {
    preview = (
      <p className="rounded-[28px] bg-white p-8 text-center text-sm text-muted shadow-card">
        Sin banners. Sube al menos una imagen para ver el carrusel.
      </p>
    );
  }

  return (
    <div className="flex flex-col overflow-hidden rounded-[28px] bg-white shadow-card lg:h-[max(620px,calc(100dvh-16rem))] lg:flex-row">
      <aside
        aria-label="Controles de edición"
        className="order-2 flex min-h-0 w-full shrink-0 flex-col border-black/10 lg:order-1 lg:w-[380px] lg:border-r"
      >
        <div className="min-h-0 flex-1 overflow-y-auto">
          <div role="group" aria-label="Elemento a editar" className="flex flex-wrap gap-2 p-4">
            {(Object.keys(TARGET_LABELS) as Target[]).map((id) => (
              <button
                key={id}
                type="button"
                aria-pressed={target === id}
                onClick={() => setTarget(id)}
                className={segmentClass(target === id)}
              >
                {TARGET_LABELS[id]}
              </button>
            ))}
          </div>

          {block ? (
            <ModuleEditor
              key={block.id}
              module={block}
              onPatch={(changes) => patchModule(block.id, changes)}
              onOrderChange={(order) => changeOrder(block.id, order)}
              products={products}
              productsLoading={productsLoading}
            />
          ) : (
            <div>
              <div className="space-y-4 px-4 pb-4">
                <Switch
                  checked={settings.is_hero_active}
                  onChange={(value) => update({ is_hero_active: value })}
                  label="Mostrar el Hero"
                  description="Apagado, la portada empieza en el catálogo."
                />
                <fieldset>
                  <legend className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted">Tipo de Hero</legend>
                  <div className="flex flex-wrap gap-2">
                    <button type="button" aria-pressed={isVideo} onClick={() => update({ hero_type: "video" })} className={segmentClass(isVideo)}>
                      Video
                    </button>
                    <button
                      type="button"
                      aria-pressed={!isVideo}
                      onClick={() => update({ hero_type: "carousel" })}
                      className={segmentClass(!isVideo)}
                    >
                      Carrusel
                    </button>
                  </div>
                </fieldset>
                {!isVideo && (
                  <>
                    <fieldset>
                      <legend className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted">
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
                    <HeroBannerList
                      banners={banners}
                      onChange={(hero_banners) => update({ hero_banners })}
                      selected={banners.length > 0 ? activeBanner : null}
                      onSelect={setBannerIndex}
                    />
                  </>
                )}
              </div>

              {isVideo && (
                <BlockEditor
                  key="hero-video"
                  value={settings.hero_video_style}
                  onChange={(hero_video_style) => update({ hero_video_style })}
                  features={HERO_FEATURES}
                  products={products}
                  productsLoading={productsLoading}
                  imageSlot={
                    <label className="block text-xs font-semibold uppercase tracking-wide text-muted">
                      URL del video
                      <input
                        type="text"
                        value={settings.hero_video_url ?? ""}
                        maxLength={500}
                        onChange={(e) => update({ hero_video_url: e.target.value })}
                        placeholder="Opcional"
                        className={inputClass}
                      />
                      <span className="mt-1 block text-[11px] font-normal normal-case tracking-normal">
                        Ruta del sitio (por ejemplo, /video/hero/mi-video.mp4) o URL https:// de Supabase Storage.
                      </span>
                    </label>
                  }
                  textSlot={
                    <HeroTextFields
                      title={settings.hero_video_title ?? ""}
                      subtitle={settings.hero_video_subtitle ?? ""}
                      onTitleChange={(hero_video_title) => update({ hero_video_title })}
                      onSubtitleChange={(hero_video_subtitle) => update({ hero_video_subtitle })}
                    />
                  }
                  ctaSlot={
                    <HeroCtaEditor
                      label="Video"
                      ctas={settings.hero_video_ctas}
                      onChange={(hero_video_ctas) => update({ hero_video_ctas })}
                    />
                  }
                />
              )}

              {!isVideo && banners[activeBanner] && (
                <BlockEditor
                  key={`banner-${banners[activeBanner].image_url}`}
                  value={banners[activeBanner].style}
                  onChange={(style) => updateBanner(activeBanner, { style })}
                  features={HERO_FEATURES}
                  products={products}
                  productsLoading={productsLoading}
                  imageSlot={
                    <label className="block text-xs font-semibold uppercase tracking-wide text-muted">
                      Banner {activeBanner + 1} · Descripción de la imagen (Opcional - Mejora el SEO)
                      <input
                        type="text"
                        spellCheck={true}
                        lang="es"
                        value={banners[activeBanner].alt}
                        maxLength={200}
                        onChange={(e) => updateBanner(activeBanner, { alt: e.target.value })}
                        className={inputClass}
                      />
                    </label>
                  }
                  textSlot={
                    <HeroTextFields
                      title={banners[activeBanner].title ?? ""}
                      subtitle={banners[activeBanner].subtitle ?? ""}
                      onTitleChange={(title) => updateBanner(activeBanner, { title })}
                      onSubtitleChange={(subtitle) => updateBanner(activeBanner, { subtitle })}
                    />
                  }
                  ctaSlot={
                    <HeroCtaEditor
                      label={`Banner ${activeBanner + 1}`}
                      ctas={banners[activeBanner].ctas}
                      onChange={(ctas) => updateBanner(activeBanner, { ctas })}
                    />
                  }
                />
              )}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2 border-t border-black/10 p-3">
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
      </aside>

      <div className="order-1 flex min-h-[420px] min-w-0 flex-1 flex-col lg:order-2 lg:min-h-0">
        <StudioCanvas device={device} onDeviceChange={setDevice}>
          {preview}
        </StudioCanvas>
      </div>
    </div>
  );
}
