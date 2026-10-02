export type StockStatus = "in_stock" | "low_stock" | "out_of_stock" | "preorder";

export type Product = {
  id: string;
  sku: string;
  name: string;
  brewery: string;
  country: string;
  style: string;
  abv: number;
  volume_ml: number;
  cost_price: number;
  sale_price: number;
  stock_status: StockStatus;
  badges: string[];
  description_ai: string | null;
  pairing_ai: string | null;
  /** Ficha del Sommelier Digital: Origen, Perfil de Cata y Maridaje Perfecto. */
  notas_origen: string | null;
  notas_perfil: string | null;
  notas_maridaje: string | null;
  image_url: string | null;
  /** Galería ordenada; la primera es la portada (`image_url`). */
  image_urls: string[];
};

export type DiscountType = "percent" | "fixed";

/** Lo que el cliente necesita saber de un código para mostrar el descuento. */
export type AppliedPromo = {
  code: string;
  discount_type: DiscountType;
  value: number;
  min_purchase: number;
};

export type PromoCode = AppliedPromo & {
  id: string;
  active: boolean;
  max_uses: number | null;
  times_used: number;
  created_at: string;
};

export type CartItem = {
  product: Product;
  quantity: number;
};

export type UserRole = "admin" | "client";

export const ESTADOS_PEDIDO = ["Pendiente", "Pagado", "Enviado", "Entregado", "Cancelado"] as const;

export type EstadoPedido = (typeof ESTADOS_PEDIDO)[number];

export type Pedido = {
  id: string;
  cliente_nombre: string;
  cliente_email: string;
  fecha: string;
  total: number;
  estado: EstadoPedido;
};

type MetodoEnvio = "nacional" | "local";

export type Direccion = {
  id: string;
  nombre_completo: string;
  telefono: string;
  calle: string;
  colonia: string;
  ciudad: string;
  estado: string;
  codigo_postal: string;
  referencias: string | null;
  predeterminada: boolean;
};

/** Copia de la dirección guardada en el pedido (no cambia si luego se edita la libreta). */
export type DireccionEnvio = Omit<Direccion, "id" | "predeterminada">;

type PedidoItem = {
  id: string;
  product_id: string | null;
  sku: string;
  nombre: string;
  precio_unitario: number;
  cantidad: number;
  importe: number;
};

export type PedidoDetalle = Pedido & {
  cliente_telefono: string | null;
  metodo_envio: MetodoEnvio;
  subtotal: number;
  costo_envio: number;
  /** Columnas de la migración 004; ausentes en pedidos anteriores. */
  promo_code?: string | null;
  descuento?: number;
  direccion: DireccionEnvio | null;
  notas: string | null;
  pedido_items: PedidoItem[];
};
