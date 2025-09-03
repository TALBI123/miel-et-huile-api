import { Request, Response, NextFunction, RequestHandler } from "express";
import { StatusCodes } from "http-status-codes";
import { ZodError, ZodObject, ZodRawShape, ZodIssue } from "zod";
export const validate =
  (shcema: ZodObject<ZodRawShape>): RequestHandler =>
  (req: Request, res: Response, next: NextFunction) => {
    try {
      shcema.parse(req.body);
    } catch (err: any) {
      if (err instanceof ZodError) {
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
