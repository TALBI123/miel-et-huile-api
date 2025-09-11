import { stringToNumber } from "../utils/helpers";
import { z } from "zod";
export const parsePositiveNumber = (key: string) =>
  z.preprocess(
    stringToNumber,
    z
      .number()
      .min(0, { message: `La valeur de ${key} doit être un nombre positif` })
  );
// --- SHEMAS CATEGORY
export const CreateCatgegorySchema = z.object({
  name: z
    .string()
    .min(1, { message: "Le nom est obligatoire" })
    .min(2, "Le nom doit contenir au moins 2 caractères"),
  description: z.string().optional(),
});
// --- SHEMAS PRODUCT

export const createProductShema = z.object({
  name: z
    .string()
    .min(1, { message: "Le nom est obligatoire" })
    .min(2, "Le nom doit contenir au moins 2 caractères"),
  description: z.string().optional(),
  price: parsePositiveNumber("prix"),
  categoryId: z
    .string()
    .uuid({ message: "L'ID de la catégorie doit être un UUID valide" }),
  stock: parsePositiveNumber("stock"),
});

// --- SHEMAS VALIDATION ID
export const ValidationId = z.object({
  id: z.string().uuid({ message: "L'ID doit être un UUID valide" }),
});

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

export type PaginationInput = z.infer<typeof PaginationSchema>;
