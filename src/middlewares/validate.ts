import { Request, Response, NextFunction, RequestHandler } from "express";
import { StatusCodes } from "http-status-codes";
import { ZodError, ZodObject, ZodRawShape, ZodIssue } from "zod";
type RequestSource = "body" | "query" | "params";
export const validate =
  (
    shcema: ZodObject<ZodRawShape>,
    key: RequestSource = "body"
  ): RequestHandler =>
  (req: Request, res: Response, next: NextFunction) => {
    try {
      shcema.parse(req[key] ?? {});
      next();
    } catch (err: any) {
      if (err instanceof ZodError) {
        console.log(req[key]," error")
        const FormatedErrors = err.issues.map((e: ZodIssue) => ({
          fielde: e.path.join("."),
          message: e.message,
        }));
        return res
          .status(StatusCodes.BAD_REQUEST)
          .json({ errors: FormatedErrors });
      }
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ message: "Une erreur serveur est survenue" });
    }
  };