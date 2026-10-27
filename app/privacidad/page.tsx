import type { Metadata } from "next";
import Link from "next/link";
import LegalPage from "@/components/LegalPage";
import CookieSettingsButton from "@/components/CookieSettingsButton";
import { CONTACT, LEGAL } from "@/lib/site";

export const metadata: Metadata = {
  title: "Aviso de privacidad",
  description: "Cómo Cervezaverso trata tus datos personales, usa cookies y cómo ejerces tus derechos ARCO.",
  alternates: { canonical: "/privacidad" },
};

const linkClass = "font-semibold text-accent hover:underline";

export default function PrivacidadPage() {
  return (
    <LegalPage
      eyebrow="Legal"
      title="Aviso de privacidad"
      intro={<p>Qué datos recabamos, para qué los usamos y cómo puedes ejercer tus derechos sobre ellos.</p>}
      updatedAt="29 de septiembre de 2026"
      draft={false}
      sections={[
        {
          id: "responsable",
          title: "Responsable del tratamiento",
          body: (
            <p>
              {LEGAL.razonSocial} (nombre comercial Cervezaverso), con RFC {LEGAL.rfc} y domicilio en {LEGAL.domicilio} Es responsable del tratamiento de tus datos personales conforme a
              la Ley Federal de Protección de Datos Personales en Posesión de los Particulares.
            </p>
          ),
        },
        {
          id: "datos",
          title: "Datos que recabamos",
          body: (
            <>
              <p>Recabamos únicamente los datos que nos das o que se generan al usar la tienda:</p>
              <ul className="list-disc space-y-2 pl-5">
                <li>Identificación y contacto: nombre, correo electrónico y teléfono.</li>
                <li>Domicilio de entrega y referencias para encontrarlo.</li>
                <li>Fecha de nacimiento, para confirmar que eres mayor de edad.</li>
                <li>
                  Datos de tu cuenta: correo, contraseña (la guarda cifrada nuestro proveedor de autenticación; nadie
                  puede leerla), pedidos, direcciones y cervezas favoritas.
                </li>
                <li>
                  Datos técnicos para seguridad: dirección IP (la guardamos transformada, sin poder leerla en claro) y
                  la verificación anti-bots.
                </li>
                <li>Datos de navegación agregados, sólo si aceptas la analítica.</li>
              </ul>
              <p>
                No recabamos datos personales sensibles. Los datos de tu tarjeta los captura directamente el
                procesador de pagos; nosotros no los vemos ni los guardamos.
              </p>
            </>
          ),
        },
        {
          id: "finalidades",
          title: "Finalidades del tratamiento",
          body: (
            <>
              <p>Usamos tus datos para estas finalidades, necesarias para darte el servicio:</p>
              <ul className="list-disc space-y-2 pl-5">
                <li>Procesar, cobrar, enviar y dar seguimiento a tus pedidos.</li>
                <li>Verificar que eres mayor de edad, como exige la venta de bebidas alcohólicas.</li>
                <li>Crear y administrar tu cuenta, tus direcciones y tus favoritos.</li>
                <li>Atender dudas, aclaraciones, cambios y devoluciones.</li>
                <li>Proteger la tienda contra fraude, spam y accesos no autorizados.</li>
              </ul>
              <p>Y, sólo con tu consentimiento, para esta finalidad adicional:</p>
              <ul className="list-disc space-y-2 pl-5">
                <li>Medir de forma agregada cómo se usa la tienda para mejorarla (Google Analytics) y de la publicidad (Google Ads).</li>
              </ul>
              <p>
                Hoy no enviamos publicidad. Si algún día lo hacemos, te pediremos permiso con una casilla que tú
                marques. Puedes negarte a la finalidad adicional desde{" "}
                <CookieSettingsButton className="font-semibold text-accent hover:underline" /> sin que eso afecte tus
                compras.
              </p>
            </>
          ),
        },
        {
          id: "transferencias",
          title: "Con quién compartimos tus datos",
          body: (
            <>
              <p>
                Para operar la tienda nos apoyamos en proveedores que tratan datos por nuestra cuenta y bajo nuestras
                instrucciones: Supabase (base de datos y cuentas), Vercel (alojamiento del sitio), Cloudflare
                (verificación anti-bots), Mercado Pago (pagos), la paquetería que entrega tu pedido y, si lo aceptas,
                Google (analítica y publicidad).
              </p>
              <p>
                No vendemos tus datos. Sólo los compartiríamos con autoridades cuando una ley o una orden judicial lo
                exija.
              </p>
            </>
          ),
        },
        {
          id: "derechos-arco",
          title: "Derechos ARCO y revocación del consentimiento",
          body: (
            <>
              <p>
                Tienes derecho a acceder a tus datos, rectificarlos, cancelarlos u oponerte a su uso (derechos ARCO),
                así como a revocar tu consentimiento. Envía tu solicitud a <a href={`mailto:${CONTACT.email}`} className="font-semibold text-accent hover:underline">
                  {CONTACT.email}
                </a>{" "}
                o por WhatsApp al {CONTACT.whatsappLabel}, con:
              </p>
              <ul className="list-disc space-y-2 pl-5">
                <li>Tu nombre y un medio para responderte.</li>
                <li>Una copia de tu identificación oficial (o la de tu representante y el documento que lo acredite).</li>
                <li>Qué derecho quieres ejercer y sobre qué datos.</li>
              </ul>
              <p>
                Te responderemos en un máximo de 20 días hábiles y, si procede, aplicaremos el cambio dentro de los 15
                días hábiles siguientes.
              </p>
              <p>
                Si consideras que tu derecho no fue atendido, puedes acudir a la Secretaría Anticorrupción y Buen
                Gobierno, autoridad en materia de protección de datos personales.
              </p>
            </>
          ),
        },
        {
          id: "cookies",
          title: "Cookies y tecnologías de rastreo",
          body: (
            <>
              <p>
                <strong>Esenciales (siempre activas):</strong> guardan tu sesión, tu carrito, tu confirmación de
                mayoría de edad y tu elección de cookies. Sin ellas la tienda no funciona.
              </p>
              <p>
                <strong>Analítica y publicidad de Google (sólo si las aceptas):</strong> usamos la etiqueta de Google
                (Google Analytics 4 y Google Ads) con el Modo de consentimiento: las cookies (<code>_ga</code>,{" "}
                <code>_gcl_*</code>) y el uso de tus datos para anuncios permanecen denegados hasta que aceptas todas
                las cookies. Mientras tanto, la etiqueta puede enviar a Google señales sin cookies (como tu dirección
                IP y el tipo de navegador) para medir visitas y compras de forma agregada. Si eliges &ldquo;Solo
                esenciales&rdquo; o retiras tu consentimiento después, esos permisos se mantienen denegados y las
                cookies se eliminan.
              </p>
              <p>
                <strong>Publicidad (sólo si aceptas todas las cookies):</strong> este sitio utiliza el Meta Pixel de
                Meta Platforms, Inc. para medir conversiones y mostrar anuncios a personas que ya visitaron la tienda
                (retargeting). El Meta Pixel puede colocar cookies (como <code>_fbp</code>) y enviar a Meta datos de
                tu navegación, como las páginas que visitas y tu dirección IP. Este rastreo publicitario está inactivo
                por defecto: no se carga ni recaba información hasta que otorgas tu consentimiento para &ldquo;todas
                las cookies&rdquo;. Si eliges &ldquo;Solo esenciales&rdquo; o retiras tu consentimiento después, el
                Meta Pixel deja de registrar tu actividad. Meta trata esos datos conforme a su propia política de
                privacidad.
              </p>
              <p>
                Puedes cambiar tu elección en cualquier momento desde{" "}
                <CookieSettingsButton className="font-semibold text-accent hover:underline" />, también disponible en
                el pie de cada página.
              </p>
            </>
          ),
        },
        {
          id: "cambios",
          title: "Cambios a este aviso",
          body: (
            <p>
              Si cambiamos este aviso, publicaremos la versión nueva en esta página con su fecha de actualización. Para
              cualquier duda, escríbenos desde{" "}
              <Link href="/contacto" className={linkClass}>
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
