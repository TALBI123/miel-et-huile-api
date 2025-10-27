import {
  ALLOWED_SIZE,
  ALLOWED_UNITS,
  AllowedTypeSizes,
  AllowedTypeUnits,
} from "../data/allowedNames";
import { z } from "zod";
import { booleanFromString, getInvalidValueMessage } from "./utils";
import {
  booleanFromStringSchema,
  FilterSchema,
  isActiveModeOptionsSchema,
  minMaxPrice,
  validePrice,
} from "./validation.shema";
import { ProductType } from "@prisma/client";
import { ProductTypeKeys } from "types/type";
interface ProductVariantData {
  amount?: number;
  unit?: string;
  price?: number;
  stock?: number;
  discountPrice?: number;
  discountPercentage?: number;
  isActive?: boolean;
}
const limits = {
  kg: { max: 10 },
  g: { min: 50 },
};

const refineobject = <T extends z.ZodRawShape>(shema: z.ZodObject<T>) =>
  shema
    .refine(
      (data: ProductVariantData) =>
        !(data.discountPrice && data.discountPercentage),
      {
        message:
          "Choisissez soit le prix de réduction, soit le pourcentage de réduction, pas les deux.",
        path: ["discountExclusive"],
      }
    )
    .refine(
      (data: ProductVariantData) =>
        !data?.discountPrice || !data.price || data.discountPrice < data?.price,
      {
        message: "Le prix de réduction doit être inférieur au prix initial",
        path: ["discountPrice"],
      }
    );
export const createProductShema = z.object({
  title: z
    .string({ message: "Le titre est requis" })
    .min(2, { message: "Le titre doit contenir au moins 2 caractères" }),
  subDescription: z
    .string({ message: "La sous description est requise" })
    .min(2, {
      message: "La sous description doit contenir au moins 2 caractères",
    }),
  description: z.string().optional(),
  isActive: booleanFromStringSchema,
  origin: z.string({ message: "L'origine est requise" }).optional(),
  productType: z
    .enum(ProductType, {
      message: "Veuillez sélectionner un type de produit valide",
    })
    .default(ProductType.HONEY),
  categoryId: z
    .string({ message: "L'ID est requis" })
    .uuid({ message: "L'ID doit être un UUID valide" }),
});
const disCountObjectPricePercentage = z.object({
  discountPrice: z
    .number({ message: "Le prix de réduction est requis" })
    .refine((val) => val >= 0, "Le prix de réduction doit être positif")
    .optional(),
  discountPercentage: z
    .number({ message: "Le pourcentage de réduction est requis" })
    .min(0, { message: "Le pourcentage de réduction doit être positif" })
    .refine((val) => val >= 0, "Le pourcentage de réduction doit être positif")
    .refine((val) => val <= 100, "Le pourcentage ne peut pas dépasser 100%")
    .optional(),
  isActive: z.boolean().optional(),
});

export const createProductVariantSchema = refineobject(
  z
    .object({
      productType: z
        .enum(ProductType, {
          message: "Veuillez sélectionner un type de produit valide",
        })
        .default(ProductType.HONEY),
      price: z
        .number({ message: "Le prix est requis" })
        .min(1, { message: "Le prix est requise" })
        .refine((price) => price > 0, "Le prix doit être positif"),
      stock: z
        .number({ message: "Le stock est requis" })
        .min(1, { message: "Le stock est requis" })
        .refine((stock) => stock >= 0, "Le stock ne peut pas être négatif"),

      unit: z.string().optional(),
      amount: z.number().optional(),
      size: z.string().optional(),
    })
    .superRefine((data, ctx) => {
      function addError(path: string, message: string) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: [path],
          message,
        });
      }

      switch (data.productType) {
        case ProductType.DATES:
        case ProductType.HONEY:
          if (!data.unit) {
            addError("unit", "L'unité est obligatoire pour ce type de produit");
          } else if (!ALLOWED_UNITS.includes(data.unit as AllowedTypeUnits))
            addError("unit", getInvalidValueMessage("Unité", ALLOWED_UNITS));

          // Amount obligatoire pour le miel
          if (!data.amount || data.amount <= 0)
            addError("amount", "La quantité est obligatoire pour le miel");

          // Validation cohérence unit/amount pour miel
          if (data.unit === "kg" && data.amount && data.amount > limits.kg.max)
            addError(
              "amount",
              "Quantité trop élevée pour l'unité sélectionnée (kg)"
            );
          if (data.unit === "g" && data.amount && data.amount < limits.g.min)
            addError(
              "amount",
              "Quantité trop faible pour l'unité sélectionnée (g)"
            );
          break;

        // 👕 VALIDATION POUR VÊTEMENTS
        case ProductType.CLOTHING:
          if (
            data.size &&
            !ALLOWED_SIZE.includes(data.size as AllowedTypeSizes)
          )
            addError("size", getInvalidValueMessage("Taille", ALLOWED_SIZE));
          break;
      }
    })
    .merge(disCountObjectPricePercentage)
);

export const updateeProductVariantSchema = refineobject(
  z
    .object({
      price: z
        .number({ message: "Le prix est requis" })
        .min(1, { message: "Le prix est requise" })
        .refine((price) => price > 0, "Le prix doit être positif")
        .optional(),
      stock: z
        .number({ message: "Le stock est requis" })
        .refine((stock) => stock >= 0, "Le stock ne peut pas être négatif")
        .optional(),
      productType: z
        .enum(ProductType, {
          message: "Veuillez sélectionner un type de produit valide",
        })
        .default(ProductType.HONEY),
      unit: z.string().optional(),
      amount: z.number().optional(),
      size: z.string().optional(),
      origin: z.string().optional(),
    })
    .superRefine((data, ctx) => {
      function addError(path: string, message: string) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: [path],
          message,
        });
      }
      switch (data.productType) {
        case ProductType.DATES:
        case ProductType.HONEY:
          if (
            data.unit &&
            !ALLOWED_UNITS.includes(data.unit as AllowedTypeUnits)
          )
            addError(
              "unit",
              `Unité invalide (${ALLOWED_UNITS.join(", ")} autorisés)`
            );

          // Validation cohérence unit/amount pour miel
          if (data.unit === "kg" && data.amount && data.amount > 10)
            addError(
              "amount",
              "Quantité trop élevée pour l'unité sélectionnée (kg)"
            );
          if (data.unit === "g" && data.amount && data.amount < 50)
            addError(
              "amount",
              "Quantité trop faible pour l'unité sélectionnée (g)"
            );
          break;

        // 👕 VALIDATION POUR VÊTEMENTS
        case ProductType.CLOTHING:
          // Size obligatoire pour vêtements
          if (
            data.size &&
            !ALLOWED_SIZE.includes(data.size as AllowedTypeSizes)
          )
            addError(
              "size",
              `Taille invalide (${ALLOWED_SIZE.join(", ")} autorisées)`
            );
          break;
      }
    })
    .merge(disCountObjectPricePercentage)
); // .refine((data) => !(data.discountPrice && data.discountPercentage), {
//   message:
//     "Choisissez soit le prix de réduction, soit le pourcentage de réduction, pas les deux.",
//   path: ["discountExclusive"],
// })
// .refine((data) => !data.discountPrice || data.discountPrice < data.price, {
//   message: "Le prix de réduction doit être inférieur au prix initial",
//   path: ["discountPrice"],
// });
// --- SCHEMAS UPLOAD IMAGES
export const productImageSchema = z.object({
  id: z
    .string({ message: "L'ID est requis" })
    .uuid({ message: "L'ID doit être un UUID valide" }),
  imageId: z
    .string({ message: "imageId de l'image est requis" })
    .uuid({ message: "imageId de l'image doit être un UUID valide" }),
});

// --- SCHEMAS UPLOAD VARIANTS
export const productVariantSchema = z.object({
  id: z
    .string({ message: "L'ID est requis" })
    .uuid({ message: "L'ID doit être un UUID valide" }),
  variantId: z
    .string({ message: "variantId de la variante est requis" })
    .uuid({ message: "variantId de la variante doit être un UUID valide" }),
});

export const QueryProductSchema = z
  .object({
    category: z
      .string()
      .min(1, { message: "La catégorie ne peut pas être vide" })
      .optional(),

    onSale: booleanFromString(
      "La valeur de onSale doit être true ou false"
    ).optional(),
    inStock: booleanFromString(
      "La valeur de inStock doit être true ou false"
    ).optional(),
    productType: z.transform((val) => {
      console.log("Preprocess productType value:", val);
      if (
        typeof val === "string" &&
        Object.values(ProductType).includes(val as ProductType)
      )
        return val;
      return "ALL";
    }),
  })
  .merge(isActiveModeOptionsSchema)
  .merge(FilterSchema)
  .merge(minMaxPrice)
  .refine(validePrice, {
    message: "Le prix minimum ne peut pas être supérieur au prix maximum",
  });
  