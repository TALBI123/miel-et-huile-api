import { Request, Response, NextFunction, RequestHandler } from "express";
import { StatusCodes } from "http-status-codes";
import { ZodError, ZodObject, ZodRawShape, ZodIssue } from "zod";
type RequestSource = "body" | "query" | "params";
interface ValidateOptions<T extends ZodObject<ZodRawShape>> {
  schema: T;
  key?: RequestSource;
  skipSave?: boolean;
}

export const validate =
  <T extends ZodObject<ZodRawShape>>({
    schema,
    key = "body",
    skipSave = false,
  }: ValidateOptions<T>): RequestHandler =>
  (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = schema.parse(req[key] ?? {});
      if (skipSave) res.locals.validated = parsed ?? {};
      next();
    } catch (err: any) {
      if (err instanceof ZodError) {
        const errorsMap: Record<string, boolean> = {};
        const errors = err.issues.reduce<{ field: string; message: string }[]>(
          (acc, err) => {
            const field = err.path.join(".");
            if (!errorsMap[field]) {
              errorsMap[field] = true;
              acc.push({ field, message: err.message });
            }
            return acc;
          },
          []
        );
        console.log(err.issues);

        return res.status(StatusCodes.BAD_REQUEST).json({ errors });
      }
      console.error(err);
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ message: "Une erreur serveur est survenue" });
    }
  };
