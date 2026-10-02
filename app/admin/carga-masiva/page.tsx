import type { Metadata } from "next";
import CatalogImporter from "@/components/admin/CatalogImporter";

export const metadata: Metadata = { title: "Carga masiva" };

export default function AdminBulkUploadPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold tracking-tight">Carga masiva de catálogo</h2>
        <p className="text-sm text-muted">
          Sube un archivo .xlsx o .csv para crear o actualizar cervezas. Puedes descargar la plantilla desde aquí.
        </p>
      </div>
      <CatalogImporter />
    </div>
  );
}
