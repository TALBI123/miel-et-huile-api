"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QueryProductSchema = exports.productVariantSchema = exports.productImageSchema = exports.updateeProductVariantSchema = exports.createProductVariantSchema = exports.createProductShema = void 0;
const allowedNames_1 = require("../data/allowedNames");
const zod_1 = require("zod");
const utils_1 = require("./utils");
const validation_shema_1 = require("./validation.shema");
const client_1 = require("@prisma/client");
const limits = {
    kg: { max: 10 },
    g: { min: 50 },
};
const refineobject = (shema) => shema
    .refine((data) => !(data.discountPrice && data.discountPercentage), {
    message: "Choisissez soit le prix de réduction, soit le pourcentage de réduction, pas les deux.",
    path: ["discountExclusive"],
})
    .refine((data) => !data?.discountPrice || !data.price || data.discountPrice < data?.price, {
    message: "Le prix de réduction doit être inférieur au prix initial",
    path: ["discountPrice"],
});
exports.createProductShema = zod_1.z.object({
    title: zod_1.z
        .string({ message: "Le titre est requis" })
        .min(2, { message: "Le titre doit contenir au moins 2 caractères" }),
    subDescription: zod_1.z
        .string({ message: "La sous description est requise" })
        .min(2, {
        message: "La sous description doit contenir au moins 2 caractères",
    }),
    description: zod_1.z.string().optional(),
    isActive: validation_shema_1.booleanFromStringSchema,
    categoryId: zod_1.z
        .string({ message: "L'ID est requis" })
        .uuid({ message: "L'ID doit être un UUID valide" }),
});
const disCountObjectPricePercentage = zod_1.z.object({
    discountPrice: zod_1.z
        .number({ message: "Le prix de réduction est requis" })
        .refine((val) => val >= 0, "Le prix de réduction doit être positif")
        .optional(),
    discountPercentage: zod_1.z
        .number({ message: "Le pourcentage de réduction est requis" })
        .min(0, { message: "Le pourcentage de réduction doit être positif" })
        .refine((val) => val >= 0, "Le pourcentage de réduction doit être positif")
        .refine((val) => val <= 100, "Le pourcentage ne peut pas dépasser 100%")
        .optional(),
    isActive: zod_1.z.boolean().optional(),
});
exports.createProductVariantSchema = refineobject(zod_1.z
    .object({
    productType: zod_1.z
        .enum(client_1.ProductType, {
        message: "Veuillez sélectionner un type de produit valide",
    })
        .default(client_1.ProductType.HONEY),
    price: zod_1.z
        .number({ message: "Le prix est requis" })
        .min(1, { message: "Le prix est requise" })
        .refine((price) => price > 0, "Le prix doit être positif"),
    stock: zod_1.z
        .number({ message: "Le stock est requis" })
        .min(1, { message: "Le stock est requis" })
        .refine((stock) => stock >= 0, "Le stock ne peut pas être négatif"),
    unit: zod_1.z.string().optional(),
    amount: zod_1.z.number().optional(),
    size: zod_1.z.string().optional(),
    origin: zod_1.z.string({ message: "L'origine est requise" }).optional(),
})
    .superRefine((data, ctx) => {
    function addError(path, message) {
        ctx.addIssue({
            code: zod_1.z.ZodIssueCode.custom,
            path: [path],
            message,
        });
    }
    switch (data.productType) {
        case client_1.ProductType.DATES:
        case client_1.ProductType.HONEY:
            if (!data.unit) {
                addError("unit", "L'unité est obligatoire pour ce type de produit");
            }
            else if (!allowedNames_1.ALLOWED_UNITS.includes(data.unit))
                addError("unit", (0, utils_1.getInvalidValueMessage)("Unité", allowedNames_1.ALLOWED_UNITS));
            // Amount obligatoire pour le miel
            if (!data.amount || data.amount <= 0)
                addError("amount", "La quantité est obligatoire pour le miel");
            // Validation cohérence unit/amount pour miel
            if (data.unit === "kg" && data.amount && data.amount > limits.kg.max)
                addError("amount", "Quantité trop élevée pour l'unité sélectionnée (kg)");
            if (data.unit === "g" && data.amount && data.amount < limits.g.min)
                addError("amount", "Quantité trop faible pour l'unité sélectionnée (g)");
            break;
        // 👕 VALIDATION POUR VÊTEMENTS
        case client_1.ProductType.CLOTHING:
            if (data.size &&
                !allowedNames_1.ALLOWED_SIZE.includes(data.size))
                addError("size", (0, utils_1.getInvalidValueMessage)("Taille", allowedNames_1.ALLOWED_SIZE));
            break;
    }
})
    .merge(disCountObjectPricePercentage));
exports.updateeProductVariantSchema = refineobject(zod_1.z
    .object({
    price: zod_1.z
        .number({ message: "Le prix est requis" })
        .min(1, { message: "Le prix est requise" })
        .refine((price) => price > 0, "Le prix doit être positif")
        .optional(),
    stock: zod_1.z
        .number({ message: "Le stock est requis" })
        .refine((stock) => stock >= 0, "Le stock ne peut pas être négatif")
        .optional(),
    productType: zod_1.z
        .enum(client_1.ProductType, {
        message: "Veuillez sélectionner un type de produit valide",
    })
        .default(client_1.ProductType.HONEY),
    unit: zod_1.z.string().optional(),
    amount: zod_1.z.number().optional(),
    size: zod_1.z.string().optional(),
    origin: zod_1.z.string().optional(),
})
    .superRefine((data, ctx) => {
    function addError(path, message) {
        ctx.addIssue({
            code: zod_1.z.ZodIssueCode.custom,
            path: [path],
            message,
        });
    }
    switch (data.productType) {
        case client_1.ProductType.DATES:
        case client_1.ProductType.HONEY:
            if (data.unit &&
                !allowedNames_1.ALLOWED_UNITS.includes(data.unit))
                addError("unit", `Unité invalide (${allowedNames_1.ALLOWED_UNITS.join(", ")} autorisés)`);
            // Validation cohérence unit/amount pour miel
            if (data.unit === "kg" && data.amount && data.amount > 10)
                addError("amount", "Quantité trop élevée pour l'unité sélectionnée (kg)");
            if (data.unit === "g" && data.amount && data.amount < 50)
                addError("amount", "Quantité trop faible pour l'unité sélectionnée (g)");
            break;
        // 👕 VALIDATION POUR VÊTEMENTS
        case client_1.ProductType.CLOTHING:
            // Size obligatoire pour vêtements
            if (data.size &&
                !allowedNames_1.ALLOWED_SIZE.includes(data.size))
                addError("size", `Taille invalide (${allowedNames_1.ALLOWED_SIZE.join(", ")} autorisées)`);
            break;
    }
})
    .merge(disCountObjectPricePercentage)); // .refine((data) => !(data.discountPrice && data.discountPercentage), {
//   message:
//     "Choisissez soit le prix de réduction, soit le pourcentage de réduction, pas les deux.",
//   path: ["discountExclusive"],
// })
// .refine((data) => !data.discountPrice || data.discountPrice < data.price, {
//   message: "Le prix de réduction doit être inférieur au prix initial",
//   path: ["discountPrice"],
// });
// --- SCHEMAS UPLOAD IMAGES
exports.productImageSchema = zod_1.z.object({
    id: zod_1.z
        .string({ message: "L'ID est requis" })
        .uuid({ message: "L'ID doit être un UUID valide" }),
    imageId: zod_1.z
        .string({ message: "imageId de l'image est requis" })
        .uuid({ message: "imageId de l'image doit être un UUID valide" }),
});
// --- SCHEMAS UPLOAD VARIANTS
exports.productVariantSchema = zod_1.z.object({
    id: zod_1.z
        .string({ message: "L'ID est requis" })
        .uuid({ message: "L'ID doit être un UUID valide" }),
    variantId: zod_1.z
        .string({ message: "variantId de la variante est requis" })
        .uuid({ message: "variantId de la variante doit être un UUID valide" }),
});
exports.QueryProductSchema = zod_1.z
    .object({
    category: zod_1.z
        .string()
        .min(1, { message: "La catégorie ne peut pas être vide" })
        .optional(),
    onSale: (0, utils_1.booleanFromString)("La valeur de onSale doit être true ou false").optional(),
    inStock: (0, utils_1.booleanFromString)("La valeur de inStock doit être true ou false").optional(),
    productType: zod_1.z.transform((val) => {
        console.log("Preprocess productType value:", val);
        if (typeof val === "string" &&
            Object.values(client_1.ProductType).includes(val))
            return val;
        return "ALL";
    }),
})
    .merge(validation_shema_1.isActiveModeOptionsSchema)
    .merge(validation_shema_1.FilterSchema)
    .merge(validation_shema_1.minMaxPrice)
    .refine(validation_shema_1.validePrice, {
    message: "Le prix minimum ne peut pas être supérieur au prix maximum",
});
//# sourceMappingURL=product.shema.js.map