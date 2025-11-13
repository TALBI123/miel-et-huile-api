import { z } from "zod";
export declare const createProductShema: z.ZodObject<{
    title: z.ZodString;
    subDescription: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    isActive: z.ZodPipe<z.ZodOptional<z.ZodString>, z.ZodTransform<boolean | undefined, string | undefined>>;
    categoryId: z.ZodString;
}, z.core.$strip>;
export declare const createProductVariantSchema: z.ZodObject<{
    productType: z.ZodDefault<z.ZodEnum<{
        HONEY: "HONEY";
        CLOTHING: "CLOTHING";
        DATES: "DATES";
        OIL: "OIL";
    }>>;
    price: z.ZodNumber;
    stock: z.ZodNumber;
    unit: z.ZodOptional<z.ZodString>;
    amount: z.ZodOptional<z.ZodNumber>;
    size: z.ZodOptional<z.ZodString>;
    origin: z.ZodOptional<z.ZodString>;
    discountPrice: z.ZodOptional<z.ZodNumber>;
    discountPercentage: z.ZodOptional<z.ZodNumber>;
    isActive: z.ZodOptional<z.ZodBoolean>;
}, z.core.$strip>;
export declare const updateeProductVariantSchema: z.ZodObject<{
    price: z.ZodOptional<z.ZodNumber>;
    stock: z.ZodOptional<z.ZodNumber>;
    productType: z.ZodDefault<z.ZodEnum<{
        HONEY: "HONEY";
        CLOTHING: "CLOTHING";
        DATES: "DATES";
        OIL: "OIL";
    }>>;
    unit: z.ZodOptional<z.ZodString>;
    amount: z.ZodOptional<z.ZodNumber>;
    size: z.ZodOptional<z.ZodString>;
    origin: z.ZodOptional<z.ZodString>;
    discountPrice: z.ZodOptional<z.ZodNumber>;
    discountPercentage: z.ZodOptional<z.ZodNumber>;
    isActive: z.ZodOptional<z.ZodBoolean>;
}, z.core.$strip>;
export declare const productImageSchema: z.ZodObject<{
    id: z.ZodString;
    imageId: z.ZodString;
}, z.core.$strip>;
export declare const productVariantSchema: z.ZodObject<{
    id: z.ZodString;
    variantId: z.ZodString;
}, z.core.$strip>;
export declare const QueryProductSchema: z.ZodObject<{
    category: z.ZodOptional<z.ZodString>;
    onSale: z.ZodOptional<z.ZodPipe<z.ZodTransform<unknown, unknown>, z.ZodBoolean>>;
    inStock: z.ZodOptional<z.ZodPipe<z.ZodTransform<unknown, unknown>, z.ZodBoolean>>;
    productType: z.ZodTransform<string, unknown>;
    mode: z.ZodDefault<z.ZodEnum<{
        with: "with";
        without: "without";
        all: "all";
    }>>;
    isActive: z.ZodPipe<z.ZodOptional<z.ZodString>, z.ZodTransform<boolean | undefined, string | undefined>>;
    isNestedActive: z.ZodPipe<z.ZodOptional<z.ZodString>, z.ZodTransform<boolean | undefined, string | undefined>>;
    page: z.ZodDefault<z.ZodPipe<z.ZodTransform<number, unknown>, z.ZodNumber>>;
    limit: z.ZodDefault<z.ZodPipe<z.ZodTransform<number, unknown>, z.ZodNumber>>;
    search: z.ZodOptional<z.ZodString>;
    minPrice: z.ZodOptional<z.ZodPipe<z.ZodString, z.ZodTransform<number, string>>>;
    maxPrice: z.ZodOptional<z.ZodPipe<z.ZodString, z.ZodTransform<number, string>>>;
}, z.core.$strip>;
