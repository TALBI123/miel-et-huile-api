import { z } from "zod";
import {
  booleanFromStringSchema,
  FilterSchema,
  isActiveModeOptionsSchema,
} from "./validation.shema";
export const CreateCategorySchema = z.object({
  name: z
    .string({ message: 'Le nom "name" est requis' })
    .min(2, { message: 'Le nom "name" doit contenir au moins 2 caractères' }),
  description: z.string().optional(),
  isActive: booleanFromStringSchema,
});
export const QueryCategorySchema = z
  .object({})
  .merge(FilterSchema)
  .merge(isActiveModeOptionsSchema);
