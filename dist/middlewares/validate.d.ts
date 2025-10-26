import { Request, Response, NextFunction, RequestHandler } from "express";
import { ZodTypeAny } from "zod";
type RequestSource = "body" | "query" | "params";
interface ValidateOptions<T extends ZodTypeAny> {
    schema: T;
    key?: RequestSource;
    skipSave?: boolean;
}
export declare const validate: <T extends ZodTypeAny>({ schema, key, skipSave, }: ValidateOptions<T>) => RequestHandler;
export declare const checkEmptyRequestBody: (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
export {};
