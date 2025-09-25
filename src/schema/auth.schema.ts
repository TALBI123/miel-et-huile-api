import { z } from "zod";
export const authSchema = z.object({
  firstName: z.string({ message: "Le prénom est requis" }).min(2, "Le prénom doit contenir au moins 2 caractères"),
  lastName: z.string({ message: "Le nom est requis" }).min(2, "Le nom doit contenir au moins 2 caractères"),
  email: z.string({ message: "L'email est requis" }).email("Format d'email invalide"),
  password: z
    .string({ message: "Le mot de passe est requis" })
    .min(6, "Le mot de passe doit contenir au moins 6 caractères"),
});

export const forgetPasswordSchema = z.object({
  email: z.string({ message: "L'email est requis" }).email("Format d'email invalide"),
});

export const resetPasswordSchema = z.object({
  newPassword: z
    .string({ message: "Le nouveau mot de passe est requis" })
    .min(6, "Le mot de passe doit contenir au moins 6 caractères"),
  token: z
    .string({ message: "Le token est requis" })
    .nonempty("Token requis")
    .regex(/^[A-Za-z0-9\-_]+$/, "Token invalide"),
});
