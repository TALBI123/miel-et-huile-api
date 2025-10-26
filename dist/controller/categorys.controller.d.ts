import { Request, Response } from "express";
import { ApiResponse, IntCategory } from "../types/type";
export declare const getAllCategorys: (req: Request, res: Response<ApiResponse<IntCategory[] | null>>) => Promise<Response<ApiResponse<IntCategory[] | null>, Record<string, any>> | undefined>;
export declare const getCategoryById: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const createCategory: (req: Request<{}, {}, IntCategory>, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const updateCategory: (req: Request<{
    id: string;
}, {}, IntCategory>, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const deleteCategory: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
