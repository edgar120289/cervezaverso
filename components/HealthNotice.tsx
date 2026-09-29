import { HEALTH_NOTICE } from "@/lib/site";

/** Leyenda de consumo responsable: footer, ficha de producto y checkout. */
export default function HealthNotice({ className = "" }: { className?: string }) {
  return <p className={`text-xs font-semibold text-muted ${className}`}>{HEALTH_NOTICE}</p>;
}
