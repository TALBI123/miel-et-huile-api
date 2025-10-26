import { Request, Response } from "express";
export declare const createCheckoutSession: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
