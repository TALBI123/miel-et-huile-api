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
 * Schéma pour l'adresse de livraison
 */
export const ShippingAddressSchema = z.object({
  address: z.string().min(5, "L'adresse doit contenir au moins 5 caractères"),
  city: z.string().min(2, "La ville doit contenir au moins 2 caractères"),
  country: z
    .string()
    .length(2, "Le code pays doit être au format ISO 2 lettres (ex: FR)")
    .toUpperCase(),
  zipCode: z.string().min(3, "Le code postal doit contenir au moins 3 caractères"),
  phone: z.string().optional(),
  name: z.string().optional(),
  email: z.string().email("Email invalide").optional(),
});

/**
 * Schéma global de la requête de checkout
 */
export const CheckoutSchema = z.object({
  // items obligatoire, tableau non vide
  items: z
    .array(CartItemSchema)
    .min(1, { message: "Le panier doit contenir au moins un article" }),
  // adresse de livraison obligatoire
  shippingAddress: ShippingAddressSchema,
  // option de livraison (optionnel, par défaut: auto)
  shippingOption: z.enum(["auto", "packlink", "zone"]).optional().default("packlink"),
  // coût de livraison
  // shippingCost: z
  //   .coerce.number({ message: "shippingCost doit être un nombre" })
  //   .nonnegative({ message: "shippingCost doit être >= 0" }),
});