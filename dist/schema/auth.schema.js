"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resetPasswordSchema = exports.forgetPasswordSchema = exports.authSchema = void 0;
const zod_1 = require("zod");
exports.authSchema = zod_1.z.object({
    firstName: zod_1.z.string({ message: "Le prénom est requis" }).min(2, "Le prénom doit contenir au moins 2 caractères"),
    lastName: zod_1.z.string({ message: "Le nom est requis" }).min(2, "Le nom doit contenir au moins 2 caractères"),
    email: zod_1.z.string({ message: "L'email est requis" }).email("Format d'email invalide"),
    password: zod_1.z
        .string({ message: "Le mot de passe est requis" })
        .min(6, "Le mot de passe doit contenir au moins 6 caractères"),
});
exports.forgetPasswordSchema = zod_1.z.object({
    email: zod_1.z.string({ message: "L'email est requis" }).email("Format d'email invalide"),
});
exports.resetPasswordSchema = zod_1.z.object({
    newPassword: zod_1.z
        .string({ message: "Le nouveau mot de passe est requis" })
        .min(6, "Le mot de passe doit contenir au moins 6 caractères"),
    token: zod_1.z
        .string({ message: "Le token est requis" })
        .nonempty("Token requis")
        .regex(/^[A-Za-z0-9\-_]+$/, "Token invalide"),
});
//# sourceMappingURL=auth.schema.js.map