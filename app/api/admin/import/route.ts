import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { MonasterioFormatError, parseMonasterio, upsertMonasterio } from "@/lib/monasterio";
import { excelUploadSchema, firstIssue, HONEYPOT_FIELD, isHoneypotFilled } from "@/lib/validation";

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

  const parsed = excelUploadSchema.safeParse({ file: formData.get("file") });
  if (!parsed.success) {
    return NextResponse.json({ error: firstIssue(parsed.error) }, { status: 400 });
  }

  try {
    const { rows, skipped } = await parseMonasterio(await parsed.data.file.arrayBuffer());
    const result = await upsertMonasterio(createAdminClient(), rows, skipped);
    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof MonasterioFormatError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    throw err;
  }
}
