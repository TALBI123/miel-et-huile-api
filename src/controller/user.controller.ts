import { PrismaClient } from "@prisma/client";
import { handleServerError } from "../utils/helpers";

import { Request, Response } from "express";

const prisma = new PrismaClient();

export const deleteUser = async (req: Request, res: Response) => {
  try {
    const data = await prisma.user.delete({
      where: { email: req.user?.email },
    });
    console.log(data);
    res
      .status(200)
      .json({ message: "user deleted successfully", success: true });
  } catch (err) {
    handleServerError(res, err);
  }
};

export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const data = await prisma.user.findMany();
    res.status(200).json({ message: "all users", success: true, users: data });
  } catch (err) {
    handleServerError(res, err);
  }
};
