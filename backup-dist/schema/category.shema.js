"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QueryCategorySchema = exports.CreateCategorySchema = void 0;
const zod_1 = require("zod");
const validation_shema_1 = require("./validation.shema");
exports.CreateCategorySchema = zod_1.z.object({
    name: zod_1.z
        .string({ message: 'Le nom "name" est requis' })
        .min(2, { message: 'Le nom "name" doit contenir au moins 2 caractères' }),
    description: zod_1.z.string().optional(),
    isActive: validation_shema_1.booleanFromStringSchema,
});
exports.QueryCategorySchema = zod_1.z
    .object({})
    .merge(validation_shema_1.FilterSchema)
    .merge(validation_shema_1.isActiveModeOptionsSchema);
//# sourceMappingURL=category.shema.js.map