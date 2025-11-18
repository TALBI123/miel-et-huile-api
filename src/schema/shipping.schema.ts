import { CartItemSchema } from "./checkout.schema";
import { phoneSchema } from "./utils";
import { z } from "zod";

/**
 * Schéma pour une adresse de livraison complète
 */
export const ShippingAddressSchema = z.object({
  address: z.string().min(5, "L'adresse doit contenir au moins 5 caractères"),
  city: z.string().min(2, "La ville doit contenir au moins 2 caractères"),
  country: z
    .string()
    .length(2, "Le code pays doit être au format ISO 2 lettres (ex: FR)")
    .toUpperCase(),
  postalCode: z.string().min(3, "Le code postal doit contenir au moins 3 caractères"),
  phoneNumber: phoneSchema,
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  email: z.string().email("Email invalide").optional(),
});

/**
 * Schéma pour calculer le coût de livraison
 */
export const CalculateShippingSchema = z.object({
  country: z
    .string()
    .length(2, "Le code pays doit être au format ISO 2 lettres (ex: FR)")
    .toUpperCase(),
  weight: z.number().positive("Le poids doit être positif"),
  dimensions: z
    .object({
      width: z.number().positive().optional(),
      height: z.number().positive().optional(),
      length: z.number().positive().optional(),
    })
    .optional(),
});

/**
 * Schéma pour obtenir les options de livraison
 */
export const ShippingOptionsSchema = z.object({
  items: z
    .array(CartItemSchema)
    .min(1, { message: "Le panier doit contenir au moins un article" }),
  // adresse de livraison obligatoire
  shippingAddress: ShippingAddressSchema,
});

/**
 * Schéma pour un devis Packlink
 */
export const PacklinkQuoteSchema = z.object({
  from: z.object({
    country: z.string().length(2).toUpperCase(),
    zipCode: z.string(),
    city: z.string().optional(),
    address: z.string().optional(),
  }),
  to: z.object({
    country: z.string().length(2).toUpperCase(),
    zipCode: z.string(),
    city: z.string(),
    address: z.string(),
  }),
  packages: z
    .array(
      z.object({
        weight: z.number().positive(),
        width: z.number().positive(),
        height: z.number().positive(),
        length: z.number().positive(),
      })
    )
    .min(1, "Au moins un colis requis"),
});

/**
 * Schéma pour mettre à jour le tracking
 */
export const UpdateTrackingSchema = z.object({
  trackingNumber: z.string().min(5, "Numéro de tracking invalide"),
  carrier: z.string().optional(),
  trackingUrl: z.string().url("URL de tracking invalide").optional(),
});

/**
 * Schéma pour marquer comme expédié
 */
export const MarkAsShippedSchema = z.object({
  trackingNumber: z.string().optional(),
  shippingMethod: z.string().optional(),
  shippingProvider: z.string().optional(),
});

/**
 * Schéma pour créer une étiquette Packlink
 */
export const CreatePacklinkLabelSchema = z.object({
  serviceId: z.string().min(1, "Service ID requis"),
  shipmentId: z.string().min(1, "Shipment ID requis"),
});

// Types TypeScript exportés
export type ShippingAddressInput = z.infer<typeof ShippingAddressSchema>;
export type CalculateShippingInput = z.infer<typeof CalculateShippingSchema>;
export type ShippingOptionsInput = z.infer<typeof ShippingOptionsSchema>;
export type PacklinkQuoteInput = z.infer<typeof PacklinkQuoteSchema>;
export type UpdateTrackingInput = z.infer<typeof UpdateTrackingSchema>;
export type MarkAsShippedInput = z.infer<typeof MarkAsShippedSchema>;
export type CreatePacklinkLabelInput = z.infer<typeof CreatePacklinkLabelSchema>;

