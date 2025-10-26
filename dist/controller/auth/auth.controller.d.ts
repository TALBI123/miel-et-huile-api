import { ApiResponse } from "../../types/type";
import { Request, Response } from "express";
interface LoginBodyRequest {
    email: string;
    password: string;
}
interface RegisterBodyRequest {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
}
export declare const register: (req: Request<{}, {}, RegisterBodyRequest>, res: Response<ApiResponse>) => Promise<Response<ApiResponse<any>, Record<string, any>> | undefined>;
export declare const login: (req: Request<{}, {}, LoginBodyRequest>, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const logout: (req: Request, res: Response) => Promise<void>;
export {};
