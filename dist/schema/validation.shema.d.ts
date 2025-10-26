import { z } from "zod";
export declare const booleanFromStringSchema: z.ZodPipe<z.ZodOptional<z.ZodString>, z.ZodTransform<boolean | undefined, string | undefined>>;
export declare const validePrice: (data: {
    minPrice?: number;
    maxPrice?: number;
}) => boolean;
export declare const dateFilterSchema: z.ZodObject<{
    startDate: z.ZodPipe<z.ZodOptional<z.ZodString>, z.ZodTransform<Date | undefined, string | undefined>>;
    endDate: z.ZodPipe<z.ZodOptional<z.ZodString>, z.ZodTransform<Date | undefined, string | undefined>>;
}, z.core.$strip>;
export declare const safeBoolean: z.ZodPipe<z.ZodUnion<readonly [z.ZodBoolean, z.ZodString]>, z.ZodTransform<boolean | undefined, string | boolean>>;
export declare const categorySlug: z.ZodObject<{
    categorySlug: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const minMaxPrice: z.ZodObject<{
    minPrice: z.ZodOptional<z.ZodPipe<z.ZodString, z.ZodTransform<number, string>>>;
    maxPrice: z.ZodOptional<z.ZodPipe<z.ZodString, z.ZodTransform<number, string>>>;
}, z.core.$strip>;
export declare const isActiveModeOptionsSchema: z.ZodObject<{
    mode: z.ZodDefault<z.ZodEnum<{
        with: "with";
        without: "without";
        all: "all";
    }>>;
    isActive: z.ZodPipe<z.ZodOptional<z.ZodString>, z.ZodTransform<boolean | undefined, string | undefined>>;
    isNestedActive: z.ZodPipe<z.ZodOptional<z.ZodString>, z.ZodTransform<boolean | undefined, string | undefined>>;
}, z.core.$strip>;
export declare const FilterSchema: z.ZodObject<{
    page: z.ZodDefault<z.ZodPipe<z.ZodTransform<number, unknown>, z.ZodNumber>>;
    limit: z.ZodDefault<z.ZodPipe<z.ZodTransform<number, unknown>, z.ZodNumber>>;
    search: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const queryOrderSchema: z.ZodObject<{
    isOnSale: z.ZodOptional<z.ZodPipe<z.ZodUnion<readonly [z.ZodBoolean, z.ZodString]>, z.ZodTransform<boolean | undefined, string | boolean>>>;
    inStock: z.ZodOptional<z.ZodPipe<z.ZodUnion<readonly [z.ZodBoolean, z.ZodString]>, z.ZodTransform<boolean | undefined, string | boolean>>>;
    status: z.ZodOptional<z.ZodEnum<{
        CONFIRMED: "CONFIRMED";
        PROCESSING: "PROCESSING";
        PENDING: "PENDING";
        FAILED: "FAILED";
        SHIPPED: "SHIPPED";
        REFUNDED: "REFUNDED";
        DELIVERED: "DELIVERED";
        CANCELLED: "CANCELLED";
    }>>;
    paymentStatus: z.ZodOptional<z.ZodEnum<{
        paid: "paid";
        unpaid: "unpaid";
    }>>;
    page: z.ZodDefault<z.ZodPipe<z.ZodTransform<number, unknown>, z.ZodNumber>>;
    limit: z.ZodDefault<z.ZodPipe<z.ZodTransform<number, unknown>, z.ZodNumber>>;
    search: z.ZodOptional<z.ZodString>;
    minPrice: z.ZodOptional<z.ZodPipe<z.ZodString, z.ZodTransform<number, string>>>;
    maxPrice: z.ZodOptional<z.ZodPipe<z.ZodString, z.ZodTransform<number, string>>>;
    startDate: z.ZodPipe<z.ZodOptional<z.ZodString>, z.ZodTransform<Date | undefined, string | undefined>>;
    endDate: z.ZodPipe<z.ZodOptional<z.ZodString>, z.ZodTransform<Date | undefined, string | undefined>>;
}, z.core.$strip>;
export declare const ValidationId: z.ZodObject<{
    id: z.ZodString;
}, z.core.$strip>;
export type FilterType = z.infer<typeof FilterSchema>;
