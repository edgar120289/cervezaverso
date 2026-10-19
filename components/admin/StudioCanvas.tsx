"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { Monitor, Smartphone } from "lucide-react";

export type StudioDevice = "desktop" | "mobile";

/** Ancho del sitio público en escritorio: `max-w-6xl` (1152 px). En móvil, un teléfono de 375 px con marco de 10 px. */
const FRAME_WIDTH: Record<StudioDevice, number> = { desktop: 1152, mobile: 395 };

const DEVICES: { id: StudioDevice; label: string; Icon: typeof Monitor }[] = [
  { id: "desktop", label: "Escritorio", Icon: Monitor },
  { id: "mobile", label: "Móvil", Icon: Smartphone },
];

type StudioCanvasProps = {
  device: StudioDevice;
  onDeviceChange: (device: StudioDevice) => void;
  children: ReactNode;
};

/**
 * Lienzo de la vista previa: fondo neutro, barra flotante Escritorio/Móvil y un marco con el ancho real del
 * dispositivo. Si el lienzo es más angosto que el marco, el marco se reduce en bloque (escala) sin reacomodar el contenido.
 */
export default function StudioCanvas({ device, onDeviceChange, children }: StudioCanvasProps) {
  const areaRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const [areaWidth, setAreaWidth] = useState(0);
  const [frameHeight, setFrameHeight] = useState(0);

  useEffect(() => {
    const area = areaRef.current;
    const frame = frameRef.current;
    if (!area || !frame) return;
    const observer = new ResizeObserver(() => {
      setAreaWidth(area.clientWidth);
      setFrameHeight(frame.offsetHeight);
    });
    observer.observe(area);
    observer.observe(frame);
    return () => observer.disconnect();
  }, [device]);

  const frameWidth = FRAME_WIDTH[device];
  const scale = areaWidth > 0 ? Math.min(1, (areaWidth - 48) / frameWidth) : 1;

  return (
    <div className="flex min-w-0 flex-1 flex-col bg-slate-100">
      <div className="flex justify-center px-4 pt-4">
        <div role="group" aria-label="Tamaño de la vista previa" className="flex gap-1 rounded-full bg-white p-1 shadow-card">
          {DEVICES.map(({ id, label, Icon }) => (
            <button
              key={id}
              type="button"
              aria-pressed={device === id}
              onClick={() => onDeviceChange(id)}
              className={`inline-flex min-h-11 items-center gap-2 rounded-full px-4 text-sm font-semibold transition-colors ${
                device === id ? "bg-black text-white" : "text-black/65 hover:bg-black/10 hover:text-black"
              }`}
            >
              <Icon size={16} aria-hidden />
              {label}
            </button>
          ))}
        </div>
      </div>

      <div ref={areaRef} className="min-h-0 flex-1 overflow-auto p-6">
        <div className="mx-auto" style={{ width: frameWidth * scale, height: frameHeight * scale }}>
          <div
            ref={frameRef}
            style={{ width: frameWidth, transform: `scale(${scale})`, transformOrigin: "top left" }}
            className={
              device === "mobile"
                ? "overflow-hidden rounded-[40px] border-[10px] border-black bg-canvas shadow-card"
                : "overflow-hidden rounded-2xl bg-canvas shadow-card ring-1 ring-black/10"
            }
          >
            <div className="p-4">{children}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
