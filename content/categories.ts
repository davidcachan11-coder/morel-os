import type { CategoryContent } from "@/content/types";
import { getMedia } from "@/content/media-registry";

/**
 * Placeholder seed content for every category — proves the provider
 * pipeline end-to-end for all 10 real CategoryIds. Descriptions are
 * intentionally generic placeholders; real per-category copy and imagery
 * are the Category pages phase's job, not this one.
 */
export const categoryContent: CategoryContent[] = [
  {
    categoryId: "frutas-verduras",
    status: "published",
    heroMedia: getMedia("category.default"),
    description: "Frutas y verduras frescas, seleccionadas a diario en sucursal.",
  },
  {
    categoryId: "carniceria",
    status: "published",
    heroMedia: getMedia("category.default"),
    description: "Cortes seleccionados, listos para tu parrilla o tu olla de todos los días.",
  },
  {
    categoryId: "lacteos-fiambres",
    status: "published",
    heroMedia: getMedia("category.default"),
    description: "Lácteos y fiambres frescos, de las marcas que ya conocés y confiás.",
  },
  {
    categoryId: "panaderia",
    status: "published",
    heroMedia: getMedia("category.default"),
    description: "Pan y facturas horneados en el día.",
  },
  {
    categoryId: "almacen",
    status: "published",
    heroMedia: getMedia("category.default"),
    description: "Lo esencial de la despensa, siempre a mano.",
  },
  {
    categoryId: "bebidas",
    status: "published",
    heroMedia: getMedia("category.default"),
    description: "Bebidas frías y de todos los días, para cada ocasión.",
  },
  {
    categoryId: "congelados",
    status: "published",
    heroMedia: getMedia("category.default"),
    description: "Congelados prácticos, sin resignar calidad.",
  },
  {
    categoryId: "limpieza",
    status: "published",
    heroMedia: getMedia("category.default"),
    description: "Todo lo que necesitás para mantener tu casa impecable.",
  },
  {
    categoryId: "perfumeria",
    status: "published",
    heroMedia: getMedia("category.default"),
    description: "Cuidado personal de las marcas de siempre.",
  },
  {
    categoryId: "bebes",
    status: "published",
    heroMedia: getMedia("category.default"),
    description: "Todo para el bienestar de los más chicos de la casa.",
  },
];
