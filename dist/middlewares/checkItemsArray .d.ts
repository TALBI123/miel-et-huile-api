import { Request, Response, NextFunction } from "express";
export declare const checkItemsArray: (req: Request, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
