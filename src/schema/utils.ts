import { ALLOWED_SIZE, ALLOWED_UNITS } from "data/allowedNames";
import { FieldOptions } from "../types/type";
import { z, ZodType } from "zod";

// ----------------- UTILITIES SCHEMAS
// ----- PRICE SCHEMA
export const optionalPriceSchema = (message: string) =>
  z.string().regex(/^\d+$/, { message }).transform(Number).optional();
export const createFieldConfig = (options: FieldOptions) => {
  const {
    type = "string",
    name,
    required = true,
    min = 0,
    minLength = 2,
  } = options;

  if (type === "number") {
    return {
      // type,
      required,
      min,
      messages: {
        required: `Le ${name} est requis`,
        invalid: `Le ${name} doit être un nombre`,
        min:
          min !== undefined
            ? `La valeur de ${name} doit être ≥ ${min}`
            : undefined,
      },
    };
  } else if (type === "string") {
    return {
      // type,
      required,
      minLength,
      messages: {
        required: `Le ${name} est obligatoire`,
        minLength:
          minLength !== undefined
            ? `Le ${name} doit contenir au moins ${minLength} caractères`
            : undefined,
      },
    };
  }
};

// ----- MESSAGES UTILITIES
export const getInvalidValueMessage = (
  key: string,
  allowed: readonly string[]
) => `${key} invalide (${allowed.join(", ")} autorisées)`;
// ----- GENERIC FIELD SCHEMA
export function createFieldSchema(options: FieldOptions): ZodType<any> {
  const {
    type = "string",
    name,
    required = true,
    min,
    minLength,
    isUUID = false,
    messages = {},
  } = options;

  if (type === "number") {
    return z
      .preprocess((val) => {
        if (val === null || val === undefined || val === "") return val;
        if (typeof val === "string") return val.trim();
        return val;
      }, z.any())
      .refine(
        (val) => {
          if (!required && (val === undefined || val === "")) return true;
          return val !== undefined && val !== "";
        },
        { message: messages.required || `Le ${name} est requis` }
      )
      .transform((val) =>
        val === "" || val === undefined ? undefined : Number(val)
      )
      .refine((val) => val === undefined || !isNaN(val), {
        message: messages.invalid || `Le ${name} doit être un nombre`,
      })
      .refine(
        (val) => val === undefined || (min !== undefined ? val >= min : true),
        { message: messages.min || `La valeur de ${name} doit être ≥ ${min}` }
      );
  } else if (type === "string") {
    let schema = z
      .preprocess((val) => {
        if (val === null || val === undefined) return val;
        if (typeof val === "string") return val.trim();
        return val;
      }, z.any())
      .refine(
        (val) => {
          if (!required && (val === undefined || val === "")) return true;
          return typeof val === "string" && val !== "";
        },
        { message: messages.required || `Le ${name} est requis` }
      )
      .refine(
        (val) =>
          val === undefined ||
          (minLength !== undefined ? val.length >= minLength : true),
        {
          message:
            messages.minLength ||
            (minLength
              ? `Le ${name} doit contenir au moins ${minLength} caractères`
              : undefined),
        }
      );

    if (isUUID) {
      const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

      schema = schema.refine(
        (val) => val === undefined || uuidRegex.test(val),
        { message: messages.invalid || `Le ${name} doit être un UUID valide` }
      );
    }

    return schema;
  }

  throw new Error("Type de champ non supporté");
}

// ----- BOOLEAN FROM STRING SCHEMA
export const booleanFromString = (message: string) =>
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
