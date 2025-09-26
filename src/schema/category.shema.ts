import { z } from "zod";
export const CreateCategorySchema = z.object({
  name: z
    .string({ message: "Le nom \"name\" est requis" })
    .min(2, { message: "Le nom \"name\" doit contenir au moins 2 caractères" }),
  description: z.string().optional(),
});
