import {  z } from "zod";
import { phoneSchema } from "./utils";

export const UserSchema = z.object({
  phoneNumber:phoneSchema,
  firstName: z.string().optional(),
  lastName: z.string().optional(),
   city: z.string().min(2, "La ville doit contenir au moins 2 caractères"),
  country: z
    .string()
    .length(2, "Le code pays doit être au format ISO 2 lettres (ex: FR)")
    .toUpperCase(),
  zipCode: z.string().min(3, "Le code postal doit contenir au moins 3 caractères"),
  address: z.string().optional(),
});
export type UserInfoType = z.infer<typeof UserSchema>;