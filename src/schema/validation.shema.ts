import { booleanFromString, optionalPriceSchema } from "./utils";
import { ALLOWED_ORDER_STATUSES } from "../data/allowedNames";
import { z } from "zod";

export const booleanFromStringSchema = z
  .string()
  .optional()
  .transform((val) => {
    console.log("Valeur reçue pour isActive:", val, "Type:", typeof val);

    if (val === "true") return true;
    if (val === "false") return false;
    return undefined; // ou une valeur par défaut
  });
// --- UTILITIES SCHEMAS

// --- SHEMAS PRODUCT
export const categorySlug = z.object({
  categorySlug: z
    .string()
    .regex(/^[a-z0-9-]+$/i)
    .optional(),
});
const minMaxPrice = z.object({
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
  nestedIsActive: booleanFromStringSchema,
});

// --- SHEMAS VALIDATION PAGINATION
export const FilterSchema = z.object({
  page: z
    .string()
    .regex(/^\d+$/, { message: "La page doit être un nombre entier positif" })
    .default("1")
    .transform(Number),
  limit: z
    .string()
    .regex(/^\d+$/, { message: "La limite doit être un nombre entier positif" })
    .default("5")
    .transform(Number),
  search: z
    .string({
      message: "La recherche /search/ doit être une chaîne de caractères",
    })
    .min(2)
    .max(100)
    .optional(),
});

// --- SHEMAS VALIDATION QUERY

export const QuerySchema = z
  .object({
    category: z
      .string()
      .min(1, { message: "La catégorie ne peut pas être vide" })
      .optional(),

    onSale: booleanFromString(
      "La valeur de onSale doit être true ou false"
    ).optional(),
    inStock: booleanFromString(
      "La valeur de inStock doit être true ou false"
    ).optional(),
  })
  .merge(isActiveModeOptionsSchema)
  .merge(FilterSchema)
  .merge(minMaxPrice)
  .refine(
    (data) =>
      data.minPrice === undefined ||
      data.maxPrice === undefined ||
      data.minPrice <= data.maxPrice,
    {
      message: "Le prix minimum ne peut pas être supérieur au prix maximum",
    }
  );
export const queryOrderSchema = z
  .object({
    status: z
      .enum(ALLOWED_ORDER_STATUSES, { message: "Statut de commande invalide" })
      .optional(),
    paymentStatus: z
      .enum(["paid", "unpaid"], { message: "Statut de paiement invalide" })
      .optional(),
  })
  .merge(FilterSchema).merge(minMaxPrice)
  .refine(
    (data) =>
      data.minPrice === undefined ||
      data.maxPrice === undefined ||
      data.minPrice <= data.maxPrice,
    {
      message: "Le prix minimum ne peut pas être supérieur au prix maximum",
    }
  );

// --- SHEMAS VALIDATION ID
export const ValidationId = z.object({
  id: z
    .string({ message: "L'ID est requis" })
    .uuid({ message: "L'ID doit être un UUID valide" }),
});
export type FilterType = z.infer<typeof FilterSchema>;
