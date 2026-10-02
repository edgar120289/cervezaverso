import type { Metadata } from "next";
import { getHeroSettings } from "@/lib/hero-settings";
import HeroSettingsForm from "@/components/admin/HeroSettingsForm";

export const metadata: Metadata = { title: "Hero de la tienda" };

export default async function AdminHeroPage() {
  const settings = await getHeroSettings();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold tracking-tight">Hero de la tienda</h2>
        <p className="text-sm text-muted">Controla la portada: apágala, elige video o carrusel y agrega botones.</p>
      </div>
      <HeroSettingsForm initial={settings} />
    </div>
  );
}
