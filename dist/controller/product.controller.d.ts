import { ApiResponse, Product, ProductVariant } from "../types/type";
import { Request, Response } from "express";
export declare const getProducts: (req: Request, res: Response<ApiResponse<Record<string, any> | null>>) => Promise<Response<ApiResponse<Record<string, any> | null>, Record<string, any>> | undefined>;
export declare const getProductById: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const createProduct: (req: Request<{}, {}, Product>, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const updateProduct: (req: Request<{
    id: string;
}, {}, Product>, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const deleteProduct: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const addProductImages: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const updateProductImage: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const deleteProductImage: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const createProductVariant: (req: Request<{
    id: string;
}, {}, ProductVariant>, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const updateProductVariant: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const deleteProductVariant: (req: Request<{
    id: string;
    variantId: string;
}>, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
