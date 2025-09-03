import { NextFunction, Request, Response } from "express";
import { ApiResponse } from "../types/type";
export declare const requireAuth: (req: Request, res: Response<ApiResponse>, next: NextFunction) => Response<ApiResponse<any>, Record<string, any>> | undefined;
