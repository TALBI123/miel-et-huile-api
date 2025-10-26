import { z } from "zod";
export declare const CreateCategorySchema: z.ZodObject<{
    name: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    isActive: z.ZodPipe<z.ZodOptional<z.ZodString>, z.ZodTransform<boolean | undefined, string | undefined>>;
}, z.core.$strip>;
export declare const QueryCategorySchema: z.ZodObject<{
    page: z.ZodDefault<z.ZodPipe<z.ZodTransform<number, unknown>, z.ZodNumber>>;
    limit: z.ZodDefault<z.ZodPipe<z.ZodTransform<number, unknown>, z.ZodNumber>>;
    search: z.ZodOptional<z.ZodString>;
    mode: z.ZodDefault<z.ZodEnum<{
        with: "with";
        without: "without";
        all: "all";
    }>>;
    isActive: z.ZodPipe<z.ZodOptional<z.ZodString>, z.ZodTransform<boolean | undefined, string | undefined>>;
    isNestedActive: z.ZodPipe<z.ZodOptional<z.ZodString>, z.ZodTransform<boolean | undefined, string | undefined>>;
}, z.core.$strip>;
