import { z } from "zod";

export const CreateCatgegorySchema = z.object({
  name: z
    .string()
    .min(1, { message: "Le nom est obligatoire" })
    .min(2, "Le nom doit contenir au moins 2 caractères"),
  description: z.string().optional(),
});
export const ValidationId = z.object({
  id: z.string().uuid({ message: "L'ID doit être un UUID valide" }),
});
export const PaginationSchema = z.object({
  page: z
    .string()
    .regex(/^\d+$/, { message: "La page doit être un nombre entier positif" })
    .transform(Number),
  limit: z
    .string()
    .regex(/^\d+$/, { message: "La limite doit être un nombre entier positif" })
    .transform(Number),
});

export type PaginationInput = z.infer<typeof PaginationSchema>;