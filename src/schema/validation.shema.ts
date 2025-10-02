import { booleanFromString } from "./utils";
import { z } from "zod";

// --- SHEMAS PRODUCT
export const booleanFromStringSchema = z
  .string()
  .optional()
  .transform((val) => {
    console.log("Valeur reçue pour isActive:", val, "Type:", typeof val);

    if (val === "true") return true;
    if (val === "false") return false;
    return undefined; // ou une valeur par défaut
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
  mode: z
    .enum(["with", "without", "all"], {
      message: "Veuillez sélectionner une unité valide",
    })
    .default("with"),
  isActive: booleanFromStringSchema,
  nestedIsActive: booleanFromStringSchema,
});
export const categorySlug = z.object({
  categorySlug: z
    .string()
    .regex(/^[a-z0-9-]+$/i)
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
    minPrice: z
      .string()
      .regex(/^\d+$/, { message: "Le prix minimum doit être un nombre" })
      .transform(Number)
      .optional(),

    maxPrice: z
      .string()
      .regex(/^\d+$/, { message: "Le prix maximum doit être un nombre" })
      .transform(Number)
      .optional(),

    inStock: booleanFromString(
      "La valeur de inStock doit être true ou false"
    ).optional(),
  })
  .merge(FilterSchema)
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
