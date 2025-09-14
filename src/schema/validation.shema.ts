import { stringToNumber } from "../utils/helpers";
import { isString } from "../types/type";
import { z } from "zod";

export const parsePositiveNumber = (key: string) =>
  z.preprocess(
    stringToNumber,
    z
      .number()
      .min(0, { message: `La valeur de ${key} doit être un nombre positif` })
  );

const regexValidateNumber = <T extends string | number>(
  value: T,
  message: string
) =>
  (typeof value === "string"
    ? z.string().regex(/^\d+$/, { message }).default(value)
    : z.number().default(value)
  )
    .transform(Number)
    .optional();

const booleanFromString = (message: string) =>
  z.preprocess(
    (val) => {
      if (val === "true") return true;
      if (val === "false") return false;
      return val;
    },
    z.boolean({
      message,
    })
  );
export const CreateCategorySchema = z.object({
  name: z
    .string()
    .min(1, { message: "Le nom est obligatoire" })
    .min(2, "Le nom doit contenir au moins 2 caractères"),
  description: z.string().optional(),
});
// --- SHEMAS PRODUCT

export const createProductShema = z.object({
  name: z
    .string()
    .min(1, { message: "Le nom est obligatoire" })
    .min(2, "Le nom doit contenir au moins 2 caractères"),
  description: z.string().optional(),
  price: parsePositiveNumber("prix"),
  categoryId: z
    .string()
    .uuid({ message: "L'ID de la catégorie doit être un UUID valide" }),
  stock: parsePositiveNumber("stock"),
  discountPrice: z
    .string()
    .min(0, { message: "Le prix de réduction doit être positif" })
    .transform(Number)
    .optional(),
  discountPercentage: z
    .string()
    .regex(/^\d+$/, {
      message: "Le pourcentage de réduction doit être positif",
    })
    .transform(Number)
    .optional(),
});

// --- SHEMAS VALIDATION PAGINATION
export const PaginationSchema = z.object({
  page: z
    .string()
    .regex(/^\d+$/, { message: "La page doit être un nombre entier positif" })
    .default("1")
    .transform(Number),
  limit: z
    .string()
    .regex(/^\d+$/, { message: "La limite doit être un nombre entier positif" })
    .default("5")
    .transform(Number),
});

// --- SHEMAS VALIDATION QUERY

export const QuerySchema = z
  .object({
    category: z
      .string()
      .min(1, { message: "La catégorie ne peut pas être vide" })
      .optional(),
    search: z.string().optional(),

    onSale: booleanFromString(
      "La valeur de onSale doit être true ou false"
    ).optional(),
    minPrice: z
      .string()
      .regex(/^\d+$/, { message: "Le prix minimum doit être un nombre" })
      .transform(Number)
      .optional(),

    maxPrice: z
      .string()
      .regex(/^\d+$/, { message: "Le prix maximum doit être un nombre" })
      .transform(Number)
      .optional(),

    inStock: booleanFromString(
      "La valeur de inStock doit être true ou false"
    ).optional(),
  })
  .merge(PaginationSchema);

// --- SHEMAS VALIDATION ID
export const ValidationId = z.object({
  id: z.string().uuid({ message: "L'ID doit être un UUID valide" }),
});

export type PaginationInput = z.infer<typeof PaginationSchema>;
