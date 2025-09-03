import { Request, Response } from "express";
import { ApiResponse } from "../../types/type";
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
declare const register: (req: Request<{}, {}, RegisterBodyRequest>, res: Response<ApiResponse>) => Promise<Response<ApiResponse<any>, Record<string, any>> | undefined>;
declare const login: (req: Request<{}, {}, LoginBodyRequest>, res: Response<ApiResponse>) => Promise<Response<ApiResponse<any>, Record<string, any>> | undefined>;
declare const logout: (req: Request, res: Response) => Promise<void>;
export { login, register, logout };
