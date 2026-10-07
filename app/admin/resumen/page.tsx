import { getResumenData, opcionesDeMes, resolverMes } from "@/lib/admin-analytics";
import MonthSelect from "@/components/admin/MonthSelect";
import ResumenView from "@/components/admin/ResumenView";

export default async function AdminResumenPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { mes: rawMes } = await searchParams;
  const mes = resolverMes(typeof rawMes === "string" ? rawMes : undefined);
  const opciones = opcionesDeMes();
  const data = await getResumenData(mes);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-2xl font-semibold tracking-tight">Resumen</h2>
        <MonthSelect value={mes} options={opciones} />
      </div>
      <ResumenView data={data} mesLabel={opciones.find((o) => o.value === mes)?.label ?? mes} />
    </div>
  );
}
