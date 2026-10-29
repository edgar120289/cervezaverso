import type { Metadata } from "next";
import { getLandingSettings } from "@/lib/hero-settings";
import LandingForm from "@/components/admin/LandingForm";
import { announcementValues, readCatalogStats } from "@/lib/announcement-server";

export const metadata: Metadata = { title: "Landing" };

export default async function AdminLandingPage() {
  const [settings, stats] = await Promise.all([getLandingSettings(), readCatalogStats()]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold tracking-tight">Landing</h2>
        <p className="text-sm text-muted">Configura la barra de arriba, el Hero y los bloques de la landing, y elige en qué orden se apilan.</p>
      </div>
      <LandingForm initial={settings} announcementValues={announcementValues(stats)} />
    </div>
  );
}
