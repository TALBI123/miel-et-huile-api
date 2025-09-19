import { stringToNumber } from "../utils/helpers";
import { z } from "zod";

// --- UTILITIES SCHEMAS

// ----- TRIM STRING SCHEMA
export const trimStringSchema = (shema: z.ZodType<string>) =>
  z.preprocess((val) => {
    return typeof val === "string" ? val.trim() : "";
  }, shema);
export const numericStringToNumberSchema = <T extends string | number>(
  value: T,
  message: string
) =>
  (typeof value === "string"
    ? z.string().regex(/^\d+$/, { message }).default(value)
    : z.number().default(value)
  )
    .transform(Number)
    .optional();

// ----- PARSE POSITIVE NUMBER SCHEMA
export const parsePositiveNumber = (key: string) =>
  z.preprocess(
    stringToNumber,
    z
      .number()
      .min(0, { message: `La valeur de ${key} doit être un nombre positif` })
  );

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
