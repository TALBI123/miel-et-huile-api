import { z } from "zod";
export const CreateCatgegorySchema = z.object({
  name: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  description: z.string().optional(),
  slug: z.string().optional(),
});
