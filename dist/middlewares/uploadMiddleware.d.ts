import { NextFunction, Request, Response } from "express";
export declare const uploadDiskMiddleware: (req: Request, res: Response, next: NextFunction) => void;
export declare const uploadMemoryStorage: import("express").RequestHandler<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>;
export declare const uploadHandler: (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
