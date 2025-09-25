import { BlacklistService } from "../../services/blacklistService.service";
import { MailOptions, UserTokenPayload } from "../../types/type";
import { sendEmail } from "../../services/emailService.service";
import { VerificationTokenType } from "../../types/enums";
import { StatusCodes } from "http-status-codes";
import { ApiResponse } from "../../types/type";
import { PrismaClient } from "@prisma/client";
import { Request, Response } from "express";
import { config } from "dotenv";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
const blacklistService = new BlacklistService();
import {
  createVerificationToken,
  generateToken,
  getExpirationDate,
  handleServerError,
} from "../../utils/helpers";
config();
const prisma = new PrismaClient();
interface LoginBodyRequest {
  email: string;
  password: string;
}

interface RegisterBodyRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

export const register = async (
  req: Request<{}, {}, RegisterBodyRequest>,
  res: Response<ApiResponse>
) => {
  console.log("est deja");
  const { firstName, lastName, email, password } = req.body;
  try {
    const data = await prisma.user.findUnique({
      where: { email },
      select: { email: true },
    });
    if (data?.email)
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ message: "l email deja existe", success: false });
    const hash = await bcrypt.hash(password, +process.env.SALT_ROUND! || 10);
    const token = generateToken();
    const link = `${
      process.env.BACKEND_URL
    }/verify-email?token=${encodeURIComponent(token)}`;

    const user = await prisma.user.create({
      data: {
        firstName,
        lastName,
        email,
        password: hash,
        termsAccepted: true,
      },
      select: { id: true },
    });
    await createVerificationToken(
      user.id,
      token,
      VerificationTokenType.EMAIL_VERIFICATION,
      15
    );
    const emailOptions: MailOptions<{ link: string }> = {
      to: email,
      subject: "verifacation de l'eamil",
      htmlFileName: "verification.email.ejs",
      context: { link },
    };
    await sendEmail(emailOptions);

    console.log(token, new Date());
    res.status(StatusCodes.CREATED).json({
      message: "Inscription réussie. Veuillez vérifier votre email",
      success: true,
    });
  } catch (err) {
    handleServerError(res, err);
  }
};

export const login = async (req: Request<{}, {}, LoginBodyRequest>, res: Response) => {
  const { email, password } = req.body;
  const data = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      password: true,
      role: true,
      isVerified: true,
    },
  });
  if (!data?.email)
    return res.status(StatusCodes.UNAUTHORIZED).json({
      success: false,
      message: "email ou mot de passe est incorrecte",
    });
  if (!data.isVerified)
    return res.status(StatusCodes.FORBIDDEN).json({
      success: false,
      message: "Veuillez confirmer votre email avant de vous connecter.",
    });

  try {
    const isPasswordValid = await bcrypt.compare(password, data.password!);
    if (!isPasswordValid)
      return res.status(StatusCodes.UNAUTHORIZED).json({
        success: false,
        message: "email ou mot de passe est incorrecte",
      });

    // Generation de JWT
    const payload: UserTokenPayload = {
      id: data.id,
      email: data.email,
      role: data.role,
    };
    const token = jwt.sign(payload, process.env.JWT_SECRET as string, {
      expiresIn: "24h",
    });

    // Configeration du cookie
    res.cookie("access_token", token, {
      httpOnly: true,
      sameSite: "none",
      secure: true,
      maxAge: 24 * 60 * 60 * 1000,
    });
    return res
      .status(StatusCodes.OK)
      .json({ message: "Connexion réussie", success: true, date: new Date() });
  } catch (err) {
    handleServerError(res, err);
  }
};

export const logout = async (req: Request, res: Response) => {
  try {
    const token = req.cookies["access_token"];
    if (token) {
      try {
        blacklistService.addToBlacklist(token);
      } catch (err) {
        console.error("Erreur lors de l'ajout du token à la blacklist:", err);
      }
    }
    res.clearCookie("access_token", {
      path: "/",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      domain: process.env.COOKIE_DOMAIN || undefined,
    });

    res.status(StatusCodes.OK).json({
      success: true,
      message: "Déconnexion réussie",
      toeknExpiration: getExpirationDate(token),
    });
  } catch (err) {
    handleServerError(res, err);
  }
};