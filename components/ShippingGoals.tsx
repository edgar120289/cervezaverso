"use client";

import { formatMXN, FREE_SHIPPING_THRESHOLD, FREE_SHIPPING_THRESHOLD_METRO } from "@/lib/pricing";
import type { ShippingZone } from "@/lib/shipping-zones";

type Goal = { id: ShippingZone; label: string; threshold: number };

const METRO_GOAL: Goal = { id: "metro", label: "CDMX y zona metropolitana", threshold: FREE_SHIPPING_THRESHOLD_METRO };
const NATIONAL_GOAL: Goal = { id: "nacional", label: "Resto del país", threshold: FREE_SHIPPING_THRESHOLD };

function GoalBar({ goal, subtotal }: { goal: Goal; subtotal: number }) {
  const missing = Math.max(0, goal.threshold - subtotal);
  const percent = Math.min(100, Math.round((subtotal / goal.threshold) * 100));
  return (
    <div>
      <div className="flex items-baseline justify-between gap-2 text-xs">
        <span className="font-semibold text-black/70">{goal.label}</span>
        <span className="text-muted">{missing > 0 ? `Te faltan ${formatMXN(missing)}` : "¡Envío gratis!"}</span>
      </div>
      <div
        role="progressbar"
        aria-label={`Progreso hacia el envío gratis: ${goal.label}`}
        aria-valuemin={0}
        aria-valuemax={goal.threshold}
        aria-valuenow={Math.min(subtotal, goal.threshold)}
        className="mt-1.5 h-2 overflow-hidden rounded-full bg-black/10"
      >
        <div className="h-full rounded-full bg-accent transition-[width] duration-300" style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}

/**
 * Metas de envío gratis. Sin CP conocido no se supone ninguna zona: se explican las dos metas y se
 * muestra el progreso hacia cada una. Con CP (dirección predeterminada) solo se muestra la de su zona.
 */
export default function ShippingGoals({ subtotal, zone }: { subtotal: number; zone: ShippingZone | null }) {
  if (zone) {
    return (
      <div className="space-y-2">
        <GoalBar goal={zone === "metro" ? METRO_GOAL : NATIONAL_GOAL} subtotal={subtotal} />
      </div>
    );
  }

  return (
    <div className="space-y-2.5">
      <p className="text-xs text-muted">
        Gratis desde {formatMXN(METRO_GOAL.threshold)} en CDMX y zona metropolitana · desde{" "}
        {formatMXN(NATIONAL_GOAL.threshold)} en el resto del país.
      </p>
      <GoalBar goal={METRO_GOAL} subtotal={subtotal} />
      <GoalBar goal={NATIONAL_GOAL} subtotal={subtotal} />
    </div>
  );
}
