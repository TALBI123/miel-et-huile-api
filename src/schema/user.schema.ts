import { phoneSchema } from "./utils";
import { z } from "zod";
// ----------------- USER SCHEMAS

export const userSchema = z.object({
  city: z
    .string()
    .min(2, "La ville doit contenir au moins 2 caractères")
    .toUpperCase(),
  country: z
    .string()
    .length(2, "Le code pays doit être au format ISO 2 lettres (ex: FR)")
    .toUpperCase(),
  postalCode: z
    .string()
    .min(3, "Le code postal doit contenir au moins 3 caractères"),
  phoneNumber: phoneSchema,
  firstName: z
    .string()
    .min(2, { message: "Le prénom doit contenir au moins 2 caractères" })
  ,
  lastName: z
    .string()
    .min(2, { message: "Le nom doit contenir au moins 2 caractères" })
    ,
  address: z.string().min(5, { message: "L'adresse est requise" })
});
// .merge(CommunUserSchema);

// Schéma pour la mise à jour des informations utilisateur
// export const updateUserSchema = z.object({}).merge(CommunUserSchema);
export type UserInfoType = z.infer<typeof userSchema>;
