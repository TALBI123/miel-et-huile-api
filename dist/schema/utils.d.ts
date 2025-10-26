import { FieldOptions } from "../types/type";
import { z, ZodType } from "zod";
export declare const optionalPriceSchema: (message: string) => z.ZodOptional<z.ZodPipe<z.ZodString, z.ZodTransform<number, string>>>;
export declare const createFieldConfig: (options: FieldOptions) => {
    required: boolean;
    min: number;
    messages: {
        required: string;
        invalid: string;
        min: string | undefined;
        minLength?: undefined;
    };
    minLength?: undefined;
} | {
    required: boolean;
    minLength: number;
    messages: {
        required: string;
        minLength: string | undefined;
        invalid?: undefined;
        min?: undefined;
    };
    min?: undefined;
} | undefined;
export declare const getInvalidValueMessage: (key: string, allowed: readonly string[]) => string;
export declare function createFieldSchema(options: FieldOptions): ZodType<any>;
export declare const booleanFromString: (message: string) => z.ZodPipe<z.ZodTransform<unknown, unknown>, z.ZodBoolean>;
