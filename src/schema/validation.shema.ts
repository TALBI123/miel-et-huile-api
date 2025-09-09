import { z } from "zod";

export const CreateCatgegorySchema = z.object({
  name: z
    .string()
    .min(1, { message: "Le nom est obligatoire" })
    .min(2, "Le nom doit contenir au moins 2 caractères"),
  description: z.string().optional(),
});

export const createProductShema = z.object({
  name: z
    .string()
    .min(1, { message: "Le nom est obligatoire" })
    .min(2, "Le nom doit contenir au moins 2 caractères"),
  description: z.string().optional(),
  price: z.number().min(0, { message: "Le prix doit être un nombre positif" }),
  categoryId: z.string().uuid({ message: "L'ID de la catégorie doit être un UUID valide" }),
  image: z.string().url({ message: "L'URL de l'image doit être valide" }),
  stock: z.number().min(0, { message: "Le stock doit être un nombre positif" }),
});

export const ValidationId = z.object({
  id: z.string().uuid({ message: "L'ID doit être un UUID valide" }),
});
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
