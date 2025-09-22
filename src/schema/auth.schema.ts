import { trimStringSchema } from "./utils";
import { z } from "zod";
export const authSchema = z.object({
  firstName: z.string().min(2, "Le prénom doit contenir au moins 2 caractères"),
  lastName: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  email: z.string().email("Format d'email invalide"),
  password: z
    .string()
    .min(6, "Le mot de passe doit contenir au moins 6 caractères"),
});

export const forgetPasswordSchema = z.object({
  email: z.string().email("Format d'email invalide"),
});

export const resetPasswordSchema = z.object({
  newPassword: trimStringSchema(
    z.string().min(6, "Le mot de passe doit contenir au moins 6 caractères")
  ),
  token: z
    .string()
    .nonempty("Token requis")
    .regex(/^[A-Za-z0-9\-_]+$/, "Token invalide"),
});
