import { PrismaClient, VerificationTokenType } from "@prisma/client";
const prisma = new PrismaClient();
import crypto from "crypto";
import { Response } from "express";
import { StatusCodes } from "http-status-codes";
// interface ValidationError {
//   type: "field" | "alternative" | "alternative-grouped" | "unknown";
//   value: any;
//   msg: string;
//   path: string;
//   location: "body" | "cookies" | "headers" | "params" | "query";
// }
export const getExpirationDate = (minutes: number): Date => {
  return new Date(Date.now() + minutes * 60 * 1000);
};
export const createVerificationToken = async (
  userId: string,
  type: VerificationTokenType,
  expiresInMinutes = 3
): Promise<string> => {
  const token = crypto.randomBytes(16).toString();
  const expiresAt = getExpirationDate(expiresInMinutes);
  await prisma.verificationTokens.create({
    data: {
      token,
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
      error.message
    );
  else
    console.error(`Server error: ${StatusCodes.INTERNAL_SERVER_ERROR}`, error);
  res
    .status(StatusCodes.INTERNAL_SERVER_ERROR)
    .json({ success: false, message: "Erreur serveur" });
};
// const UniquerErors = (arr: ValidationError[]) => {
// };
// export {UniquerErors}
