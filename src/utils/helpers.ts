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
export const generateSlug = (name: string, isLower = true): string => {
  return slugify(name, { lower: isLower, strict: true });
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
export const timeAgo = (dateString : string) => {
  const date = new Date(dateString);
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
  if(seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if(minutes < 60) return `${minutes}m:${seconds % 60}s ago`;
  const hours = Math.floor(minutes / 60);
  if(hours < 24) return `${hours}h:${minutes % 60}m ago`;
  const days = Math.floor(hours / 24);
  if(days < 30) return `${days}d:${hours % 24}h ago`;
  const months = Math.floor(days / 30);
  if(months < 12) return `${months}mo:${days % 30}d ago`;
  const years = Math.floor(months / 12);
  return `${years}y ago`;
}