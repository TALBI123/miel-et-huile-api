import { hashToken, isExpired } from "../../utils/helpers";
import { StatusCodes } from "http-status-codes";
import { PrismaClient } from "@prisma/client";
import { Request, Response } from "express";
import path from "path";
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
    const rowFlow = decodeURIComponent(token);
    const hashedToken = hashToken(rowFlow);
    console.log("Token reçu :", token);
    if (!token) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ message: "Le token est requis" });
    }
    console.log("Recherche du token dans la base de données...");
    const verificationToken = await prisma.verificationTokens.findUnique({
      where: { token: hashedToken },
    });
    console.log(verificationToken, token);
    if (!verificationToken)
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ message: "Token invalide" });

    if (isExpired(verificationToken.expiresAt)) {
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
    res.sendFile(path.join(__dirname, "../../../views/verified-email.html"));
  } catch (err) {
    console.error("Erreur lors de la vérification de l'email :", err);
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: "Erreur serveur interne" });
  }
};
