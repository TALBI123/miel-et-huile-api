import { VerificationTokenType } from "../types/enums";
import { StatusCodes } from "http-status-codes";
import { PrismaClient } from "@prisma/client";
import { Response, Express } from "express";
import crypto from "crypto";
import slugify from "slugify";
import fs from "fs";
import { FilterType } from "schema/validation.shema";

const prisma = new PrismaClient();
export const getExpirationDate = (minutes: number): Date => {
  return new Date(Date.now() + minutes * 60 * 1000);
};

export const hashToken = (token: string) => {
  // SHA-256 hex, suffit si stocké seul. Pour plus de sécurité, utiliser HMAC avec secret.
  return crypto
    .createHmac("sha256", process.env.SECRET_KEY as string)
    .update(token)
    .digest("base64url");
};

export const generateToken = (len = 32): string => {
  // retourne base64url pour être safe dans les URL
  return crypto.randomBytes(len).toString("base64url");
};
export const generateSlug = (name: string): string => {
  return slugify(name, { lower: true, strict: true });
};



export function isExpired(date: Date) {
  return date.getTime() < Date.now();
}

export const createVerificationToken = async (
  userId: string,
  token: string,
  type: VerificationTokenType,
  expiresInMinutes = 17
): Promise<string> => {
  const expiresAt = getExpirationDate(expiresInMinutes);
  const hashedToken = hashToken(token);
  console.log(hashedToken);
  await prisma.verificationTokens.create({
    data: {
      token: hashedToken,
      userId,
      type,
      expiresAt,
    },
  });
  return token;
};

export const handleServerError = (res: Response, error: unknown) => {
  if (error instanceof Error)
    console.error(
      `Server error: ${StatusCodes.INTERNAL_SERVER_ERROR}`,
      error.message,
      error
    );
  else
    console.error(
      `------> Server error : ${StatusCodes.INTERNAL_SERVER_ERROR}`,
      error,
      {
        api_key: process.env.SENDGRID_API_KEY,
      }
    );
  res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
    success: false,
    message: "Erreur serveur",
    error,
  });
};
export const cleanUploadedFiles = (files: Express.Multer.File[]) => {
  files.forEach((file) => {
    if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
  });
};
