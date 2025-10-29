import { z } from "zod";
import { FilterSchema } from "./validation.shema";
import { clamp } from "../utils/mathUtils";

export const reviewSchemas = {
  createReview: z.object({
    rating: z
      .number()
      .int()
      .min(1, "La note doit être entre 1 et 5")
      .max(5, "La note doit être entre 1 et 5"),
    comment: z
      .string()
      .min(10, "Le commentaire doit contenir au moins 10 caractères")
      .max(1000, "Le commentaire ne peut pas dépasser 1000 caractères")
      .trim(),
    title: z
      .string()
      .min(5, "Le titre doit contenir au moins 5 caractères")
      .max(100, "Le titre ne peut pas dépasser 100 caractères")
      .trim()
      .optional(),
  }),

  updateReview: z.object({
    rating: z
      .number()
      .int()
      .min(1, "La note doit être entre 1 et 5")
      .max(5, "La note doit être entre 1 et 5")
      .optional(),
    comment: z
      .string()
      .min(10, "Le commentaire doit contenir au moins 10 caractères")
      .max(1000, "Le commentaire ne peut pas dépasser 1000 caractères")
      .trim()
      .optional(),
    title: z
      .string()
      .min(5, "Le titre doit contenir au moins 5 caractères")
      .max(100, "Le titre ne peut pas dépasser 100 caractères")
      .trim()
      .optional(),
  }),
  getReviews: z
    .object({
      rating: z
        .preprocess((val) => {
          // val vient de req.query (string | undefined)
          const num = Number(String(val ?? "1"));
          return clamp(num, 1, 5);
        }, z.number().int().min(1))
        .optional(),
    })
    .merge(FilterSchema),
};
export const getAllReviewSchema = z
  .object({
    status: z.enum(["approved", "pending", "all"]).default("all"),
  })
  .merge(FilterSchema)
  .merge(reviewSchemas.getReviews);
