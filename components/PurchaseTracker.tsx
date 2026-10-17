"use client";

import { useEffect } from "react";
import { trackPurchase, type PurchaseOrder } from "@/lib/meta-pixel";

const STORAGE_KEY = "cv-purchase-tracked";
const RETRY_MS = 500;
const MAX_TRIES = 20;

function alreadyTracked(id: string): boolean {
  try {
    return window.localStorage.getItem(`${STORAGE_KEY}:${id}`) === "1";
  } catch {
    return false;
  }
}

function markTracked(id: string) {
  try {
    window.localStorage.setItem(`${STORAGE_KEY}:${id}`, "1");
  } catch {
    // Sin almacenamiento: puede repetirse al recargar, Meta deduplica por eventID.
  }
}

/**
 * Dispara Purchase una sola vez por pedido ya cobrado. El pixel carga después de la hidratación
 * y solo con consentimiento, así que se reintenta unos segundos; sin consentimiento no hace nada.
 */
export default function PurchaseTracker({ order }: { order: PurchaseOrder }) {
  useEffect(() => {
    if (alreadyTracked(order.id)) return;
    let tries = 0;
    const timer = window.setInterval(() => {
      tries += 1;
      if (trackPurchase(order)) {
        markTracked(order.id);
        window.clearInterval(timer);
      } else if (tries >= MAX_TRIES) {
        window.clearInterval(timer);
      }
    }, RETRY_MS);
    return () => window.clearInterval(timer);
  }, [order]);

  return null;
}
