"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ValidationId = exports.queryOrderSchema = exports.FilterSchema = exports.isActiveModeOptionsSchema = exports.minMaxPrice = exports.categorySlug = exports.safeBoolean = exports.dateFilterSchema = exports.validePrice = exports.booleanFromStringSchema = void 0;
const utils_1 = require("./utils");
const allowedNames_1 = require("../data/allowedNames");
const zod_1 = require("zod");
const mathUtils_1 = require("../utils/mathUtils");
exports.booleanFromStringSchema = zod_1.z
    .string()
    .optional()
    .transform((val) => {
    if (val === "true")
        return true;
    if (val === "false")
        return false;
    return undefined; // ou une valeur par défaut
});
const shcemaDate = zod_1.z
    .string()
    .optional()
    .transform((val) => {
    if (!val)
        return undefined;
    const date = new Date(val);
    return isNaN(date.getTime()) ? undefined : date;
});
const validePrice = (data) => data.minPrice === undefined ||
    data.maxPrice === undefined ||
    data.minPrice <= data.maxPrice;
exports.validePrice = validePrice;
// --- UTILITIES SCHEMAS
// --- SHEMAS PRODUCT
// ------ Date
exports.dateFilterSchema = zod_1.z.object({
    startDate: shcemaDate,
    endDate: shcemaDate,
});
// ✅ Fonction utilitaire qui transforme une valeur en boolean ou undefined
exports.safeBoolean = zod_1.z
    .union([zod_1.z.boolean(), zod_1.z.string()])
    .transform((val) => {
    if (typeof val === "boolean")
        return val;
    if (typeof val === "string") {
        const normalized = val.toLowerCase();
        if (normalized === "true")
            return true;
        if (normalized === "false")
            return false;
    }
    return undefined; // 🔥 valeur ignorée si ce n’est pas true/false
});
// .transform((data) => {
//   return data.startDate && data.endDate && data.startDate > data.endDate
//     ? undefined
//     : data;
// });
exports.categorySlug = zod_1.z.object({
    categorySlug: zod_1.z
        .string()
        // .regex(/^[a-z0-9-]+$/i)
        .optional(),
});
exports.minMaxPrice = zod_1.z.object({
    minPrice: (0, utils_1.optionalPriceSchema)("Le prix minimum doit être un nombre"),
    maxPrice: (0, utils_1.optionalPriceSchema)("Le prix maximum doit être un nombre"),
});
exports.isActiveModeOptionsSchema = zod_1.z.object({
    mode: zod_1.z
        .enum(["with", "without", "all"], {
        message: "Veuillez sélectionner une unité valide",
    })
        .default("with"),
    isActive: exports.booleanFromStringSchema,
    isNestedActive: exports.booleanFromStringSchema,
});
// --- SHEMAS VALIDATION PAGINATION
exports.FilterSchema = zod_1.z.object({
    page: zod_1.z
        .preprocess((val) => {
        // val vient de req.query (string | undefined)
        const num = Number(String(val ?? "1"));
        return (0, mathUtils_1.clamp)(num, 1, Number.MAX_SAFE_INTEGER);
    }, zod_1.z.number().int().min(1))
        .default(1),
    limit: zod_1.z
        .preprocess((val) => {
        const num = Number(String(val ?? "5"));
        return (0, mathUtils_1.clamp)(num);
    }, zod_1.z.number().int().min(1).max(Number.MAX_SAFE_INTEGER))
        .default(5),
    search: zod_1.z
        .string({
        message: "La recherche /search/ doit être une chaîne de caractères",
    })
        .min(1)
        .max(100)
        .optional(),
});
// --- SHEMAS VALIDATION QUERY
exports.queryOrderSchema = zod_1.z
    .object({
    isOnSale: exports.safeBoolean.optional(),
    inStock: exports.safeBoolean.optional(),
    status: zod_1.z
        .enum(allowedNames_1.ALLOWED_ORDER_STATUSES, { message: "Statut de commande invalide" })
        .optional(),
    paymentStatus: zod_1.z
        .enum(["paid", "unpaid"], { message: "Statut de paiement invalide" })
        .optional(),
})
    .merge(exports.FilterSchema)
    .merge(exports.minMaxPrice)
    .refine(exports.validePrice, {
    message: "Le prix minimum ne peut pas être supérieur au prix maximum",
})
    .merge(exports.dateFilterSchema)
    .refine((data) => {
    console.log("Date de début:", data.startDate);
    console.log("Date de fin:", data.endDate);
    console.log("Data : ", data);
    return data.startDate && data.endDate && data.startDate > data.endDate
        ? { startDate: undefined, endDate: undefined }
        : data;
    // return true;
});
// --- SHEMAS VALIDATION ID
exports.ValidationId = zod_1.z.object({
    id: zod_1.z
        .string({ message: "L'ID est requis" })
        .uuid({ message: "L'ID doit être un UUID valide" }),
});
//# sourceMappingURL=validation.shema.js.map