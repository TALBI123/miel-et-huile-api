import { z } from "zod";
/**
 * Schéma d'un item du panier
 * - productId: UUID string
 * - variantId: UUID string (optionnel selon ton modèle)
 * - quantity: entier >= 1
 */
export declare const CartItemSchema: z.ZodObject<{
    productId: z.ZodString;
    variantId: z.ZodOptional<z.ZodString>;
    quantity: z.ZodCoercedNumber<unknown>;
}, z.core.$strip>;
/**
 * Schéma global de la requête de checkout
 */
export declare const CheckoutSchema: z.ZodObject<{
    shippingCost: z.ZodCoercedNumber<unknown>;
    items: z.ZodArray<z.ZodObject<{
        productId: z.ZodString;
        variantId: z.ZodOptional<z.ZodString>;
        quantity: z.ZodCoercedNumber<unknown>;
    }, z.core.$strip>>;
}, z.core.$strip>;
