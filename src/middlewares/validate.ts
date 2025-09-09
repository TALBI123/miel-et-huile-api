import { Request, Response, NextFunction, RequestHandler } from "express";
import { StatusCodes } from "http-status-codes";
import { ZodError, ZodObject, ZodRawShape, ZodIssue } from "zod";
type RequestSource = "body" | "query" | "params";
export const validate =
  <T extends ZodObject<ZodRawShape>>(
    schema: T,
    key: RequestSource = "body"
  ): RequestHandler =>
  (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = schema.parse(req[key] ?? {});
      if (key === "query" || key === "body") res.locals.validated = parsed;
      next();
    } catch (err: any) {
      if (err instanceof ZodError) {
        console.log(err.issues);
        const FormatedErrors = err.issues.map((e: ZodIssue) => ({
          fielde: e.path.join("."),
          message: e.message,
        }));
        return res
          .status(StatusCodes.BAD_REQUEST)
          .json({ errors: FormatedErrors });
      }
      console.error(err);
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ message: "Une erreur serveur est survenue" });
    }
  };
