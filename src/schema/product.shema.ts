import { ALLOWED_USER_UNITS } from "../data/allowedNames";
import { z } from "zod";
import { booleanFromString } from "./utils";
import { FilterSchema, isActiveModeOptionsSchema, minMaxPrice, validePrice } from "./validation.shema";
interface ProductVariantData {
  amount?: number;
  unit?: string;
  price?: number;
  stock?: number;
  discountPrice?: number;
  discountPercentage?: number;
  isActive?: boolean;
}
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
  isActive: z
    .string()
    .optional()
    .transform((val) => {
      console.log("Valeur reçue pour isActive:", val, "Type:", typeof val);

      if (val === "true") return true;
      if (val === "false") return false;
      return undefined; // ou une valeur par défaut
    }),
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
      amount: z
        .number({ message: "La quantité est requise" })
        .min(1, { message: "La quantité est requise" }),
      unit: z.enum(ALLOWED_USER_UNITS, {
        message: `Veuillez sélectionner une unité valide " ${ALLOWED_USER_UNITS.join(
          " , "
        )} "`,
      }),
      price: z
        .number({ message: "Le prix est requis" })
        .min(1, { message: "Le prix est requise" })
        .refine((price) => price > 0, "Le prix doit être positif"),
      stock: z
        .number({ message: "Le stock est requis" })
        .min(1, { message: "Le stock est requis" })
        .refine((stock) => stock >= 0, "Le stock ne peut pas être négatif"),
    })
    .merge(disCountObjectPricePercentage)
);

export const updateeProductVariantSchema = refineobject(
  z
    .object({
      amount: z
        .number({ message: "La quantité est requise" })
        .min(1, { message: "La quantité est requise" })
        .optional(),
      unit: z
        .enum(ALLOWED_USER_UNITS, {
          message: `Veuillez sélectionner une unité valide " ${ALLOWED_USER_UNITS.join(
            " , "
          )} "`,
        })
        .optional(),
      price: z
        .number({ message: "Le prix est requis" })
        .min(1, { message: "Le prix est requise" })
        .refine((price) => price > 0, "Le prix doit être positif")
        .optional(),
      stock: z
        .number({ message: "Le stock est requis" })
        .refine((stock) => stock >= 0, "Le stock ne peut pas être négatif")
        .optional(),
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
  })
  .merge(isActiveModeOptionsSchema)
  .merge(FilterSchema)
  .merge(minMaxPrice)
  .refine(validePrice, {
    message: "Le prix minimum ne peut pas être supérieur au prix maximum",
  });