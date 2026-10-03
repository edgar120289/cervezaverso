import type { Metadata } from "next";
import { getLandingSettings } from "@/lib/hero-settings";
import AppearanceForm from "@/components/admin/AppearanceForm";

export const metadata: Metadata = { title: "Apariencia" };

export default async function AdminAppearancePage() {
  const settings = await getLandingSettings();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold tracking-tight">Apariencia</h2>
        <p className="text-sm text-muted">Configura el Hero y los bloques de la landing, y elige en qué orden se apilan.</p>
      </div>
      <AppearanceForm initial={settings} />
    </div>
  );
}
