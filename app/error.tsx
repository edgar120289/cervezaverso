"use client";

import { useEffect } from "react";
import ErrorState from "@/components/ErrorState";

export default function Error({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useEffect(() => {
    // Sólo el identificador: el detalle queda en los logs del servidor.
    console.error("[error]", error.digest ?? "sin digest");
  }, [error]);

  return <ErrorState onRetry={retry} />;
}
