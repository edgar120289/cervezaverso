import { formatMXN, FLAT_SHIPPING_COST, FREE_SHIPPING_THRESHOLD, FREE_SHIPPING_THRESHOLD_METRO } from "@/lib/pricing";
import { CONTACT, LEGAL } from "@/lib/site";

export type FaqItem = { question: string; answer: string };

/** Preguntas frecuentes: texto plano, para la página y para el JSON-LD FAQPage. */
export const FAQ_ITEMS: FaqItem[] = [
  {
    question: "¿Cuánto cuesta el envío y cuánto tarda en llegar mi pedido?",
    answer: `En CDMX y zona metropolitana el envío es gratis desde ${formatMXN(FREE_SHIPPING_THRESHOLD_METRO)} y cuesta ${formatMXN(FLAT_SHIPPING_COST)} en pedidos menores; la entrega tarda de 24 a 48 horas. En el resto de la República es gratis desde ${formatMXN(FREE_SHIPPING_THRESHOLD)} y cuesta ${formatMXN(FLAT_SHIPPING_COST)} en pedidos menores; la entrega tarda de 3 a 6 días hábiles por paquetería. Procesamos los pedidos en un máximo de 24 horas, y si pagas por transferencia el proceso es más rápido.`,
  },
  {
    question: "¿Cómo puedo pagar?",
    answer:
      "Con Mercado Pago (tarjeta de crédito o débito, SPEI y efectivo en OXXO) o con transferencia bancaria. Los pagos en línea se procesan en la página segura de Mercado Pago: nunca vemos ni guardamos los datos de tu tarjeta.",
  },
  {
    question: "¿Puedo comprar si soy menor de edad?",
    answer:
      "No. La venta es exclusiva para mayores de 18 años. Confirmamos tu fecha de nacimiento al comprar y, al recibir tu pedido, te pediremos una identificación oficial vigente.",
  },
  {
    question: "¿Tienen tienda física? ¿Puedo recoger mi pedido?",
    answer:
      "No. Cervezaverso es una tienda 100% en línea: no tenemos sucursal ni atención al público, y tampoco hay recolección en el local. Todos los pedidos se entregan a domicilio.",
  },
  {
    question: "¿Cómo solicito mi factura?",
    answer: `Solicítala dentro del mismo mes de tu compra a ${LEGAL.emailFacturas}.`,
  },
  {
    question: "¿En qué horario me pueden atender?",
    answer: `De lunes a domingo, de 9:00 a 21:00, por WhatsApp al ${CONTACT.whatsappLabel} o en ${CONTACT.email}.`,
  },
];
