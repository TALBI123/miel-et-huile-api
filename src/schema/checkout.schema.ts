import { z } from "zod";

/**
 * Schéma d'un item du panier
 * - productId: UUID string
 * - variantId: UUID string (optionnel selon ton modèle)
 * - quantity: entier >= 1
 */
export const CartItemSchema = z.object({
  productId: z.string().uuid({ message: "productId doit être un UUID valide" }),
  variantId: z
    .string()
    .uuid({ message: "variantId doit être un UUID valide" })
    .optional(),
  // accepte string ou number, coerce en number et vérifie entier >=1
  quantity: z
    .coerce.number({ message: "quantity doit être un nombre" })
    .int({ message: "quantity doit être un entier" })
    .min(1, { message: "quantity doit être au minimum 1" }),
});
/**
 * Schéma global de la requête de checkout
 */
export const CheckoutSchema = z.object({
  shippingCost: z
    .coerce.number({ message: "shippingCost doit être un nombre" })
    .nonnegative({ message: "shippingCost doit être >= 0" }),
  // items obligatoire, tableau non vide
  items: z
    .array(CartItemSchema)
    .min(1, { message: "Le panier doit contenir au moins un article" }),
});