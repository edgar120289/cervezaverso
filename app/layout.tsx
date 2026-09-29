import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/lib/cart-context";
import { AccountProvider } from "@/lib/account-context";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CartDrawer from "@/components/CartDrawer";
import AgeGateModal from "@/components/AgeGateModal";
import WhatsAppFAB from "@/components/WhatsAppFAB";
import GoogleAnalytics from "@/components/GoogleAnalytics";
import { listPublicImages, MEDIA_DIRS } from "@/lib/media";
import { SITE } from "@/lib/site";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: "Cervezaverso — Cerveza artesanal nacional e importada",
    template: "%s · Cervezaverso",
  },
  description: SITE.description,
  applicationName: SITE.name,
  keywords: ["cerveza artesanal", "cerveza importada", "cerveza mexicana", "tienda de cerveza", "Cervezaverso"],
  openGraph: {
    type: "website",
    locale: SITE.locale,
    url: "/",
    siteName: SITE.name,
    title: "Cervezaverso — Cerveza artesanal nacional e importada",
    description: SITE.description,
  },
  twitter: {
    card: "summary_large_image",
    title: "Cervezaverso — Cerveza artesanal nacional e importada",
    description: SITE.description,
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  const tarros = listPublicImages(MEDIA_DIRS.tarros);
  const capasCirculares = listPublicImages(MEDIA_DIRS.capasCirculares);

  return (
    <html lang="es" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-[#f2f4f5]">
        <AccountProvider>
          <CartProvider>
            <AgeGateModal logoImages={capasCirculares} logoFrame={`/${MEDIA_DIRS.marcoCircular}`} />
            <Header logoImages={tarros} />
            <main className="flex-1">{children}</main>
            <Footer logoImages={capasCirculares} logoFrame={`/${MEDIA_DIRS.marcoCircular}`} />
            <CartDrawer />
            <WhatsAppFAB />
          </CartProvider>
        </AccountProvider>
        <GoogleAnalytics />
      </body>
    </html>
  );
}
