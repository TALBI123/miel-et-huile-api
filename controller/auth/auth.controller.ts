import { PrismaClient, VerificationTokenType } from "@prisma/client";
import { StatusCodes } from "http-status-codes";
import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import {
  createVerificationToken,
  handleServerError,
} from "../../utils/helpers";
import { sendEmail } from "../../utils/mailer";
import { MailOptions } from "../../types/type";
const prisma = new PrismaClient();
interface LoginBodyRequest {
  email: string;
  password: string;
}
interface LoginBodyResponse {
  message: string;
  success: boolean;
  token?: string;
  errors?: string;
}
interface RegisterBodyRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}
interface RegisterBodyResponse {
  message: string;
  success: boolean;
  errors?: string;
}
const register = async (
  req: Request<{}, {}, RegisterBodyRequest>,
  res: Response<RegisterBodyResponse>
) => {
  const { firstName, lastName, email, password } = req.body;
  try {
    const data = await prisma.user.findFirst({
      where: { email },
      select: { email: true },
    });
    console.log(VerificationTokenType);
    if (data?.email)
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ message: "Email ou mot de passe incorrect", success: false });
    const hash = await bcrypt.hash(password, 10);
    const token = crypto.randomBytes(16).toString("hex");
    const link = `http://localhost:${process.env.PORT}/auth/verification-email?token=${token}`;
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
      VerificationTokenType.EMAIL_VERIFICATION
    );
    const emailOptions: MailOptions<{ link: string }> = {
      to: email,
      subject: "verifacation de l'eamil",
      htmlFileName: "verification.email.ejs",
      context: { link },
    };
    await sendEmail(emailOptions);
    res.status(StatusCodes.CREATED).json({
      message: "Inscription réussie. Veuillez vérifier votre email",
      success: true,
    });
  } catch (err) {
    handleServerError(res, err);
  }
};

const login = async (
  req: Request<{}, {}, LoginBodyRequest>,
  res: Response<LoginBodyResponse>
) => {
  const { email, password } = req.body;

  const data = await prisma.user.findFirst({ where: { email } });
  console.log(data);
  const hash = "";
  try {
    const isPasswordValid = await bcrypt.compare(hash, password);
    if (isPasswordValid)
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "email ou mot de passe est incorrecte",
      });
    const token = jwt.sign(
      { id: 2, email: "" },
      process.env.JWT_SECRET as string,
      { expiresIn: "1h" }
    );
    console.log(token);
    return res
      .status(200)
      .json({ message: "is Loged in", success: true, token });
  } catch (err) {
    handleServerError(res, err);
  }
};

const logout = async (req: Request, res: Response) => {
  try {
  } catch (err) {
    handleServerError(res, err);
  }
};
export { login, register };
