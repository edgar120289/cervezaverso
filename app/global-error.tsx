"use client";

import { useEffect } from "react";
import { Inter } from "next/font/google";
import ErrorState from "@/components/ErrorState";
import "./globals.css";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });

/** Reemplaza al layout raíz cuando éste falla: define su propio <html> y <body>. */
export default function GlobalError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useEffect(() => {
    console.error("[global-error]", error.digest ?? "sin digest");
  }, [error]);

  return (
    <html lang="es-MX" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full bg-canvas py-10">
        <title>Algo salió mal · Cervezaverso</title>
        <ErrorState onRetry={retry} />
      </body>
    </html>
  );
}
