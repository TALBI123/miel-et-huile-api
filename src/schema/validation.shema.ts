import { booleanFromString, optionalPriceSchema, sanitizeDateRange } from "./utils";
import { ALLOWED_ORDER_STATUSES } from "../data/allowedNames";
import { clamp } from "../utils/mathUtils";
import { z } from "zod";

export const booleanFromStringSchema = z
  .string()
  .optional()
  .transform((val) => {
    if (val === "true") return true;
    if (val === "false") return false;
    return undefined; // ou une valeur par défaut
  });
const shcemaDate = z
  .string()
  .optional()
  .transform((val) => {
    if (!val) return undefined;
    const date = new Date(val);
    return isNaN(date.getTime()) ? undefined : date;
  });
export const validePrice = (data: { minPrice?: number; maxPrice?: number }) =>
  data.minPrice === undefined ||
  data.maxPrice === undefined ||
  data.minPrice <= data.maxPrice;
// --- UTILITIES SCHEMAS

// --- SHEMAS PRODUCT
// ------ Date
export const dateFilterSchema = z.object({
  startDate: shcemaDate,
  endDate: shcemaDate,
});

// ✅ Fonction utilitaire qui transforme une valeur en boolean ou undefined
export const safeBoolean = z
  .union([z.boolean(), z.string()])
  .transform((val) => {
    if (typeof val === "boolean") return val;
    if (typeof val === "string") {
      const normalized = val.toLowerCase();
      if (normalized === "true") return true;
      if (normalized === "false") return false;
    }
    return undefined; // 🔥 valeur ignorée si ce n’est pas true/false
  });

// .transform((data) => {
//   return data.startDate && data.endDate && data.startDate > data.endDate
//     ? undefined
//     : data;
// });
export const categorySlug = z.object({
  categorySlug: z
    .string()
    // .regex(/^[a-z0-9-]+$/i)
    .optional(),
});
export const minMaxPrice = z.object({
  minPrice: optionalPriceSchema("Le prix minimum doit être un nombre"),
  maxPrice: optionalPriceSchema("Le prix maximum doit être un nombre"),
});
export const isActiveModeOptionsSchema = z.object({
  mode: z
    .enum(["with", "without", "all"], {
      message: "Veuillez sélectionner une unité valide",
    })
    .default("with"),
  isActive: booleanFromStringSchema,
  isNestedActive: booleanFromStringSchema,
});

// --- SHEMAS VALIDATION PAGINATION

export const FilterSchema = z.object({
  page: z
    .preprocess((val) => {
      // val vient de req.query (string | undefined)
      const num = Number(String(val ?? "1"));
      return clamp(num,1, Number.MAX_SAFE_INTEGER);
    }, z.number().int().min(1))
    .default(1),
  limit: z
    .preprocess((val) => {
      const num = Number(String(val ?? "5"));
      return clamp(num);
    }, z.number().int().min(1).max(Number.MAX_SAFE_INTEGER))
    .default(5),
  search: z
    .string({
      message: "La recherche /search/ doit être une chaîne de caractères",
    })
    .min(1)
    .max(100)
    .optional(),
});

// --- SHEMAS VALIDATION QUERY

export const queryOrderSchema = z
  .object({
    isOnSale: safeBoolean.optional(),
    inStock: safeBoolean.optional(),
    status: z
      .enum(ALLOWED_ORDER_STATUSES, { message: "Statut de commande invalide" })
      .optional(),
    paymentStatus: z
      .enum(["paid", "unpaid"], { message: "Statut de paiement invalide" })
      .optional(),
  })
  .merge(FilterSchema)
  .merge(minMaxPrice)
  .refine(validePrice, {
    message: "Le prix minimum ne peut pas être supérieur au prix maximum",
  })
  .merge(dateFilterSchema)
  .transform(sanitizeDateRange);
// --- SHEMAS VALIDATION ID
export const ValidationId = z.object({
  id: z
    .string({ message: "L'ID est requis" })
    .uuid({ message: "L'ID doit être un UUID valide" }),
});
export type FilterType = z.infer<typeof FilterSchema>;
