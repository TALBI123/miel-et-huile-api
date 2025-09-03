import { NextFunction, Request, Response } from "express";
declare const handleValidationErrors: (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
export { handleValidationErrors };
