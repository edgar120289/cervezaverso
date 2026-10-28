import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { parseCatalogFile } from "@/lib/catalog-import";
import { applyCatalogPlan, planCatalogImport } from "@/lib/catalog-plan";
import { MonasterioFormatError } from "@/lib/monasterio";
import { catalogUploadSchema, firstIssue, HONEYPOT_FIELD, isHoneypotFilled } from "@/lib/validation";

/**
 * Carga masiva en dos pasos con el mismo archivo:
 * - `mode=preview`: devuelve el plan (qué se crea, qué cambia, qué se ignora) sin escribir nada.
 * - `mode=apply`: recalcula el plan y lo aplica solo si coincide con la vista previa (`fingerprint`);
 *   si la base o el archivo cambiaron entre medias, pide generar la vista previa otra vez.
 */
/** La primera carga con proveedor toca cientos de filas: margen para el límite de Vercel. */
export const maxDuration = 60;

const applySchema = z.object({
  fingerprint: z.string().regex(/^[a-f0-9]{64}$/),
  retire: z.array(z.uuid()).max(2000),
});

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "No autenticado." }, { status: 401 });
  }
  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "admin") {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }

  const formData = await req.formData();
  if (isHoneypotFilled(formData.get(HONEYPOT_FIELD))) {
    return NextResponse.json({ error: "Solicitud rechazada." }, { status: 400 });
  }

  const parsed = catalogUploadSchema.safeParse({ file: formData.get("file") });
  if (!parsed.success) {
    return NextResponse.json({ error: firstIssue(parsed.error) }, { status: 400 });
  }

  const mode = formData.get("mode") === "apply" ? "apply" : "preview";

  try {
    const admin = createAdminClient();
    const plan = await planCatalogImport(admin, await parseCatalogFile(parsed.data.file));

    if (mode === "preview") {
      return NextResponse.json({ plan });
    }

    let retire: unknown = [];
    try {
      retire = JSON.parse(String(formData.get("retire") ?? "[]"));
    } catch {
      return NextResponse.json({ error: "Solicitud inválida." }, { status: 400 });
    }
    const options = applySchema.safeParse({ fingerprint: formData.get("fingerprint"), retire });
    if (!options.success) {
      return NextResponse.json({ error: "Solicitud inválida." }, { status: 400 });
    }
    if (options.data.fingerprint !== plan.fingerprint) {
      return NextResponse.json(
        { error: "El catálogo cambió desde la vista previa. Vuelve a revisar los cambios antes de aplicarlos." },
        { status: 409 }
      );
    }

    const result = await applyCatalogPlan(admin, plan, options.data.retire);
    return NextResponse.json({ result });
  } catch (err) {
    if (err instanceof MonasterioFormatError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    throw err;
  }
}
