import { ApiResponse } from "../types/type";
import { NextFunction, Request, Response } from "express";
export declare const verifyToken: (req: Request, res: Response<ApiResponse>, next: NextFunction) => Response<ApiResponse<any>, Record<string, any>> | undefined;
export declare const verifyAdmin: (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
