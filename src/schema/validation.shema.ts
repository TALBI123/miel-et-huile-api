import { FieldOptions } from "../types/type";
import {
  booleanFromString,
  createFieldConfig,
  createFieldSchema,
} from "./utils";
import { z } from "zod";

export const CreateCategorySchema = z.object({
  name: createFieldSchema(
    createFieldConfig({ name: "titre", minLength: 2 }) as FieldOptions
  ),
  description: z.string().optional(),
});
// --- SHEMAS PRODUCT

// --- SHEMAS VALIDATION PAGINATION
export const PaginationSchema = z.object({
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
});

// --- SHEMAS VALIDATION QUERY

export const QuerySchema = z
  .object({
    category: z
      .string()
      .min(1, { message: "La catégorie ne peut pas être vide" })
      .optional(),
    search: z.string().optional(),

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
  .merge(PaginationSchema);

// --- SHEMAS VALIDATION ID
export const ValidationId = z.object({
  id: z
    .string({ message: "L'ID est requis" })
    .uuid({ message: "L'ID doit être un UUID valide" }),
});

export type PaginationInput = z.infer<typeof PaginationSchema>;
