import { z } from "zod";

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
  categoryId: z
    .string({ message: "L'ID est requis" })
    .uuid({ message: "L'ID doit être un UUID valide" }),
});
export const createProductVariantSchema = z.object({
  amount: z
    .string({ message: "Le prix est requis" })
    .min(0, { message: "Le prix doit être positif" })
    .transform(Number),
  unit: z.enum(["g", "kg", "ml", "L"], {
    message: "Veuillez sélectionner une unité valide",
  }),
  price: z
    .string({ message: "Le prix est requis" })
    .min(0, { message: "Le prix doit être positif" })
    .transform(Number),
  stock: z
    .string({ message: "Le stock est requis" })
    .min(0, { message: "Le stock doit être positif" })
    .transform(Number),
  discountPrice: z
    .string()
    .min(0, { message: "Le prix de réduction doit être positif" })
    .transform(Number)
    .optional(),
  discountPercentage: z
    .string()
    .min(0, { message: "Le pourcentage de réduction doit être positif" })
    .transform(Number)
    .optional(),
  productId: z
    .string({ message: "L'ID est requis" })
    .uuid({ message: "L'ID doit être un UUID valide" }),
});
// --- SHEMAS UPLOAD IMAGES
export const deleteProductImageSchema = z.object({
  id: z
    .string({ message: "L'ID est requis" })
    .uuid({ message: "L'ID doit être un UUID valide" }),
  imageId: z
    .string({ message: "L'ID de l'image est requis" })
    .uuid({ message: "L'ID de l'image doit être un UUID valide" }),
});