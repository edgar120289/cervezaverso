"use client";

import { useEffect } from "react";
import { gaPurchase, type GooglePurchase } from "@/lib/google-tag";
import { trackPurchase as metaPurchase } from "@/lib/meta-pixel";

const STORAGE_KEY = "cv-purchase-tracked";
const RETRY_MS = 500;
const MAX_TRIES = 20;

type Channel = "google" | "meta";

function alreadyTracked(channel: Channel, id: string): boolean {
  try {
    return window.localStorage.getItem(`${STORAGE_KEY}:${channel}:${id}`) === "1";
  } catch {
    return false;
  }
}

function markTracked(channel: Channel, id: string) {
  try {
    window.localStorage.setItem(`${STORAGE_KEY}:${channel}:${id}`, "1");
  } catch {
    // Sin almacenamiento puede repetirse al recargar; GA4 y Meta deduplican por id de pedido.
  }
}

/**
 * Dispara la compra (GA4 `purchase`, conversión de Google Ads y Meta `Purchase`) una sola vez por
 * pedido ya cobrado y por canal. Las etiquetas cargan después de la hidratación, así que se
 * reintenta unos segundos; el Meta Pixel solo existe con consentimiento y Google respeta el suyo.
 */
export default function PurchaseTracker({ order }: { order: GooglePurchase }) {
  useEffect(() => {
    const channels: [Channel, (order: GooglePurchase) => boolean][] = [
      ["google", gaPurchase],
      ["meta", metaPurchase],
    ];
    const pending = channels.filter(([channel]) => !alreadyTracked(channel, order.id));
    if (pending.length === 0) return;

    let tries = 0;
    const timer = window.setInterval(() => {
      tries += 1;
      for (let i = pending.length - 1; i >= 0; i--) {
        const [channel, send] = pending[i];
        if (send(order)) {
          markTracked(channel, order.id);
          pending.splice(i, 1);
        }
      }
      if (pending.length === 0 || tries >= MAX_TRIES) window.clearInterval(timer);
    }, RETRY_MS);
    return () => window.clearInterval(timer);
  }, [order]);

  return null;
}
