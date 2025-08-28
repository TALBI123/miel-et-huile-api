import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";
import { StatusCodes } from "http-status-codes";
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
  const { email, password } = req.body;
  try {
    const data = await prisma.emp.findMany();
    console.log(data);
    res
      .status(200)
      .json({ message: "is Register successfully", success: true });
  } catch (err) {}
};
const login = async (
  req: Request<{}, {}, LoginBodyRequest>,
  res: Response<LoginBodyResponse>
) => {
  const { email, password } = req.body;
  const data = await prisma.emp.create({ data: { name: "mhayeb" } });
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
  } catch (err) {}
};
export { login, register };
