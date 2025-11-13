"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CheckoutSchema = exports.CartItemSchema = void 0;
const zod_1 = require("zod");
/**
 * Schéma d'un item du panier
 * - productId: UUID string
 * - variantId: UUID string (optionnel selon ton modèle)
 * - quantity: entier >= 1
 */
exports.CartItemSchema = zod_1.z.object({
    productId: zod_1.z.string().uuid({ message: "productId doit être un UUID valide" }),
    variantId: zod_1.z
        .string()
        .uuid({ message: "variantId doit être un UUID valide" })
        .optional(),
    // accepte string ou number, coerce en number et vérifie entier >=1
    quantity: zod_1.z
        .coerce.number({ message: "quantity doit être un nombre" })
        .int({ message: "quantity doit être un entier" })
        .min(1, { message: "quantity doit être au minimum 1" }),
});
/**
 * Schéma global de la requête de checkout
 */
exports.CheckoutSchema = zod_1.z.object({
    shippingCost: zod_1.z
        .coerce.number({ message: "shippingCost doit être un nombre" })
        .nonnegative({ message: "shippingCost doit être >= 0" }),
    // items obligatoire, tableau non vide
    items: zod_1.z
        .array(exports.CartItemSchema)
        .min(1, { message: "Le panier doit contenir au moins un article" }),
});
//# sourceMappingURL=checkout.schema.js.map