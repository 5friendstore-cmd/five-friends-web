export const EMAILJS_CONFIG = {
  PASS_PUBLIC_KEY: "k2u203TouhD3PPrZU",
  PASS_SERVICE_ID: "service_k329g2o",
  PASS_TEMPLATE_ID: "template_f9qsdal",
  ORDERS_PUBLIC_KEY: "6EJ7vQEuZeRa9HQ1o",
  ORDERS_SERVICE_ID: "service_oykr20y",
  ORDERS_TEMPLATE_ADMIN: "template_jfmj9i8",
  ORDERS_TEMPLATE_CLIENT: "template_5pk8lbk"
};

export const MP_PUBLIC_KEY = "APP_USR-c1b88801-4173-4b05-9b88-38c24b43b08f";

export const SUPABASE_CONFIG = {
  URL: "https://vqsuycquoeqakhttibao.supabase.co",
  KEY: "sb_publishable_iglMJnYPy3iFulCFv3j_qw_s3An5vme"
};

export const ORDER_STAGES = [
  "Recibido",
  "En preparación",
  "Terminado",
  "Enviado / Listo para recoger",
  "Entregado"
];

export const DEFAULT_WORKSHOP_CONFIG = {
  filCostPerKg: 380,
  filWeightGrams: 1000,
  wastePct: 10,
  watts: 120,
  costPerKwh: 3.50,
  printerCost: 14500,
  printerLifespanHours: 3000,
  wearPerHour: 4.50,
  hourlyRate: 120,
  minPrep: 10,
  minProd: 5,
  minPost: 15,
  minPack: 10,
  packMaterialCost: 18,
  monthlyFixed: 2500,
  monthlyHours: 250,
  zipOrigin: "54807",
  markupPct: 80,
  taxPct: 0,
  shipBase: 135
};

export const DEFAULT_CATALOG_ITEMS = [
  { id: "p1", title: "Soporte Articulado para Escritorio", description: "Impresión en PETG de alta resistencia térmica y mecánica.", price: 290, cost: 95, category: "Llaveros y Portallaveros", weight: 0.4, length: 15, width: 15, height: 10, image_url: "", badge: "PETG Resistente" },
  { id: "p2", title: "Organizador Modular de Herramientas", description: "Bandejas encastrables con ranuras y tolerancias ajustadas.", price: 340, cost: 110, category: "Estuches y Alcancias", weight: 0.6, length: 20, width: 15, height: 12, image_url: "", badge: "Pieza Funcional" },
  { id: "p3", title: "Diorama Exhibidor Edición Especial", description: "Base modular temática para figuras coleccionables con acentos detallados.", price: 420, cost: 180, category: "Coleccionables", weight: 1.2, length: 25, width: 25, height: 20, image_url: "", badge: "Coleccionables" },
  { id: "p4", title: "Marco Rígido para Cartas TCG", description: "Caja rígida con protección UV para coleccionistas de Pokémon y Magic.", price: 260, cost: 80, category: "Coleccionables", weight: 0.3, length: 15, width: 10, height: 5, image_url: "", badge: "TCG Pro" },
  { id: "p5", title: "Landing Page para Emprendedores", description: "Diseño minimalista ultra rápido, responsivo y adaptado para captar clientes.", price: 3200, cost: 500, category: "Desarrollo Web", weight: 0, length: 0, width: 0, height: 0, image_url: "", badge: "Servicio Digital" },
  { id: "p6", title: "Tienda Online E-commerce", description: "Catálogo autogestionable y cobros con Mercado Pago con pasarela configurada.", price: 6500, cost: 1200, category: "Desarrollo Web", weight: 0, length: 0, width: 0, height: 0, image_url: "", badge: "Servicio Digital" }
];
