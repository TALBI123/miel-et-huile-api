import { VerificationTokenType } from "@prisma/client";
import { Response } from "express";
export declare const getExpirationDate: (minutes: number) => Date;
export declare const createVerificationToken: (userId: string, type: VerificationTokenType, expiresInMinutes?: number) => Promise<string>;
export declare const handleServerError: (res: Response, error: unknown) => void;
