import { Request, Response } from "express";
interface VerifyEmailQuery {
    token: string;
}
export declare const verifyEmail: (req: Request<{}, {}, {}, VerifyEmailQuery>, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export {};
