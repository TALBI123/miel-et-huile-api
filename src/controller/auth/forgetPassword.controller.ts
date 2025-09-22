import { sendEmail } from "../../services/emailService.service";
import { VerificationTokenType } from "../../types/enums";
import { PrismaClient } from "@prisma/client";
import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import {
  createVerificationToken,
  generateToken,
  handleServerError,
  hashToken,
  isExpired,
} from "../../utils/helpers";

const prisma = new PrismaClient();
export const forgetPassword = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    if (user) {
      const token = generateToken();
      await createVerificationToken(
        user.id,
        token,
        VerificationTokenType.PASSWORD_RESET,
        5
      );
      const link = `${
        process.env.FRONTEND_URL
      }/reset-password?token=${encodeURIComponent(token)}`;
      await sendEmail({
        to: email,
        subject: "Réinitialisation du mot de passe",
        htmlFileName: "reset.password.ejs",
        context: {
          link,
        },
      });
    }
    res.json({
      message:
        "If this email exists, you will receive a password reset link shortly.",
    });
  } catch (err) {
    console.error("forgotPassword error:", err);
    // Réponse générique
    res.status(500).json({ message: "An error occurred." });
  }
};

export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { token, newPassword } = req.body;
    const rowFlow = decodeURIComponent(token);
    const hashedToken = hashToken(rowFlow);
    const verificationToken = await prisma.verificationTokens.findUnique({
      where: { token: hashedToken },
    });
    if (!verificationToken)
      return res.status(400).json({ success: false,message: "Invalid or expired token" });

    if (verificationToken.type !== VerificationTokenType.PASSWORD_RESET)
      return res.status(400).json({ success: false,message: "Invalid token type" });

    if (isExpired(verificationToken.expiresAt)) {
      await prisma.verificationTokens.delete({
        where: { token: verificationToken.token },
      });
      return res.status(400).json({ success: false,message: "Token has expired" });
    }
    const hashedPassword = await bcrypt.hash(newPassword, 11);
    await prisma.$transaction([
      prisma.user.update({
        where: { id: verificationToken.userId },
        data: { password: hashedPassword },
      }),
      prisma.verificationTokens.delete({
        where: { token: verificationToken.token },
      }),
    ]);
    res.status(200).json({success: true, message: "Password has been reset successfully" });
  } catch (err) {
    handleServerError(res, err);
  }
};
