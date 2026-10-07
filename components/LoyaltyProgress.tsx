import { Beer, Gift, Lock } from "lucide-react";
import CopyCodeButton from "@/components/CopyCodeButton";
import { NIVELES_RECOMPENSA, calcularProgreso } from "@/lib/lealtad";

export type Recompensa = { code: string; reward_level: number; reward_label: string; times_used: number };

const META = NIVELES_RECOMPENSA[NIVELES_RECOMPENSA.length - 1].botellas;

/** «Mi Progreso»: barra de botellas hacia el siguiente premio y códigos ya ganados. */
export default function LoyaltyProgress({
  botellas,
  recompensas,
  nivelesSecretos,
}: {
  botellas: number;
  recompensas: Recompensa[];
  nivelesSecretos: boolean;
}) {
  const progreso = calcularProgreso(botellas);
  // La barra recorre todo el camino (0 a 60); los hitos marcan cada premio.
  const ancho = Math.min(100, (botellas / META) * 100);

  return (
    <div className="space-y-6 rounded-[28px] bg-white p-6 shadow-card">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <p className="text-4xl font-semibold tabular-nums tracking-[-0.04em]">
          {botellas} <span className="text-base font-normal text-muted">{botellas === 1 ? "botella" : "botellas"}</span>
        </p>
        <p className="text-sm text-muted">
          {progreso.siguiente
            ? `Te faltan ${progreso.faltan} para ${progreso.siguiente.premio}`
            : nivelesSecretos
              ? "¡Desbloqueaste los niveles secretos 80 y 100!"
              : "¡Completaste todos los premios!"}
        </p>
      </div>

      <div className="pb-8">
        <div
          role="progressbar"
          aria-label="Progreso de botellas"
          aria-valuemin={0}
          aria-valuemax={META}
          aria-valuenow={Math.min(botellas, META)}
          className="relative h-4 rounded-full bg-canvas"
        >
          <div className="h-full rounded-full bg-accent transition-[width] duration-700" style={{ width: `${ancho}%` }} />
          {NIVELES_RECOMPENSA.map((nivel) => {
            const alcanzado = botellas >= nivel.botellas;
            return (
              <span
                key={nivel.botellas}
                className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2"
                style={{ left: `${(nivel.botellas / META) * 100}%` }}
              >
                <span
                  className={`flex h-7 w-7 items-center justify-center rounded-full border-2 border-white shadow-card ${
                    alcanzado ? "bg-accent text-white" : "bg-canvas text-muted"
                  }`}
                >
                  {alcanzado ? <Gift size={14} /> : <Beer size={14} />}
                </span>
                <span className="absolute left-1/2 top-9 -translate-x-1/2 whitespace-nowrap text-xs font-semibold tabular-nums text-muted">
                  {nivel.botellas}
                </span>
              </span>
            );
          })}
        </div>
      </div>

      {!nivelesSecretos && (
        <p className="flex items-center gap-2 text-xs text-muted">
          <Lock size={14} /> Al llegar a {META} botellas se desbloquean dos niveles secretos.
        </p>
      )}

      <div className="space-y-3">
        <h3 className="text-sm font-semibold">Mis códigos de recompensa</h3>
        {recompensas.length === 0 ? (
          <p className="text-sm text-muted">Aquí aparecerán tus códigos al desbloquear cada premio.</p>
        ) : (
          <ul className="space-y-2">
            {recompensas.map((r) => (
              <li key={r.code} className="flex flex-wrap items-center justify-between gap-3 rounded-[20px] bg-canvas px-4 py-3">
                <div className="min-w-0">
                  <p className="text-xs text-muted">
                    {r.reward_label} · nivel {r.reward_level}
                    {r.times_used > 0 && " · canjeado"}
                  </p>
                  <p className="break-all font-semibold tabular-nums tracking-wide">{r.code}</p>
                </div>
                <CopyCodeButton code={r.code} />
              </li>
            ))}
          </ul>
        )}
        <p className="text-xs text-muted">
          Cada código es personal y de un solo uso. Para canjearlo, escríbenos con tu pedido y lo agregamos.
        </p>
      </div>
    </div>
  );
}
