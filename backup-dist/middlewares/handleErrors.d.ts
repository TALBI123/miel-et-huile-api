import { Request, Response, NextFunction } from "express";
export declare const errorHandler: (err: unknown, req: Request, res: Response, _next: NextFunction) => Response<any, Record<string, any>> | undefined;
