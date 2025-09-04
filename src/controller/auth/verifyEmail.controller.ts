import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { StatusCodes } from "http-status-codes";
interface VerifyEmailQuery {
  token: string;
}
const prisma = new PrismaClient();
export const verifyEmail = async (
  req: Request<{}, {}, {}, VerifyEmailQuery>,
  res: Response
) => {
  try {
    const { token } = req.query;
    console.log("Token reçu :", token)
    if (!token) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ message: "Le token est requis" });
    }

    const verificationToken = await prisma.verificationTokens.findUnique({
      where: { token },
    });
    if (!verificationToken) {
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ message: "Token invalide" });
    }
    if (verificationToken.expiresAt < new Date()) {
      await prisma.user.delete({ where: { id: verificationToken.userId } });
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ message: "Token expiré" });
    }
    await prisma.$transaction([
      prisma.user.update({
        where: { id: verificationToken.userId },
        data: { isVerified: true },
      }),
      prisma.verificationTokens.delete({
        where: { token: verificationToken.token },
      }),
    ]);
  } catch (err) {
    console.error("Erreur lors de la vérification de l'email :", err);
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: "Erreur serveur interne" });
  }
};
