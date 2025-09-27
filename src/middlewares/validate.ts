import { Request, Response, NextFunction, RequestHandler } from "express";
import { StatusCodes } from "http-status-codes";
import { isEmptyObject } from "../utils/object";
import { ZodError, ZodTypeAny } from "zod";

type RequestSource = "body" | "query" | "params";

// Corrigez l'interface pour accepter les deux types
interface ValidateOptions<T extends ZodTypeAny> {
  schema: T;
  key?: RequestSource;
  skipSave?: boolean;
}

export const validate =
  <T extends ZodTypeAny>({
    schema,
    key = "body",
    skipSave = false,
  }: ValidateOptions<T>): RequestHandler =>
  (req: Request, res: Response, next: NextFunction) => {
    try {
      // console.log(req[key], " req[key]");
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

export const checkEmptyRequestBody = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!req.file && isEmptyObject(req.body || {}))
    return res.status(StatusCodes.BAD_REQUEST).json({
      success: false,
      message: "Aucune donnée valide fournie pour la mise à jour",
    });
  next();
};
