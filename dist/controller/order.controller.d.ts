import { Request, Response } from "express";
export declare const getOrders: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const getMyOrders: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const getOrderById: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const updateOrder: (req: Request, res: Response) => Promise<void>;
export declare const cancelOrder: (req: Request, res: Response) => Promise<void>;
