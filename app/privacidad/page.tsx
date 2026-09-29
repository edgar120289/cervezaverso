import type { Metadata } from "next";
import Link from "next/link";
import LegalPage from "@/components/LegalPage";

export const metadata: Metadata = {
  title: "Aviso de privacidad",
  description: "Cómo Cervezaverso trata tus datos personales y usa cookies.",
  alternates: { canonical: "/privacidad" },
};

const DUMMY =
  "Texto de ejemplo pendiente de redacción. Aquí se describirá este apartado conforme a la Ley Federal de Protección de Datos Personales en Posesión de los Particulares.";

export default function PrivacidadPage() {
  return (
    <LegalPage
      eyebrow="Legal"
      title="Aviso de privacidad"
      intro={<p>Qué datos recabamos, para qué los usamos y cómo puedes ejercer tus derechos sobre ellos.</p>}
      updatedAt="25 de septiembre de 2026"
      sections={[
        { id: "responsable", title: "Responsable del tratamiento", body: <p>{DUMMY}</p> },
        { id: "datos", title: "Datos que recabamos", body: <p>{DUMMY}</p> },
        { id: "finalidades", title: "Finalidades del tratamiento", body: <p>{DUMMY}</p> },
        {
          id: "cookies",
          title: "Cookies y tecnologías similares",
          body: (
            <p>
              Usamos cookies esenciales para que la tienda funcione (sesión y carrito) y cookies de analítica para
              entender cómo se usa el sitio y mejorar tu experiencia. Las aceptas al confirmar tu mayoría de edad en
              la pantalla de bienvenida. {DUMMY}
            </p>
          ),
        },
        { id: "derechos-arco", title: "Derechos ARCO", body: <p>{DUMMY}</p> },
        {
          id: "cambios",
          title: "Cambios a este aviso",
          body: (
            <p>
              {DUMMY} Para cualquier solicitud, escríbenos desde{" "}
              <Link href="/contacto" className="font-semibold text-accent hover:underline">
                contacto
              </Link>
              .
            </p>
          ),
        },
      ]}
    />
  );
}
