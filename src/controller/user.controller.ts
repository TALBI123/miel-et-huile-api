import { PrismaClient } from "@prisma/client";
import { handleServerError } from "../utils/helpers";

import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";

const prisma = new PrismaClient();

// Middleware pour authentifier les requêtes protégées
export const getCurrentUser = async (req: Request, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user?.id },
      select: { id: true, email: true, role: true }, // rôle ici
    });

    if (!user) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: "Utilisateur non trouvé",
      });
    }

    res.status(StatusCodes.OK).json({
      success: true,
      user,
    });
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

// Supprimer un utilisateur par son ID (accessible uniquement aux admins)
export const deleteUserById = async (req: Request, res: Response) => {
  const { id } = req.query;
  try {
    const user = await prisma.user.delete({
      where: { id: id as string },
    });
    res.status(200).json({ message: "User deleted successfully", user });
  } catch (err) {
    handleServerError(res, err);
  }
};
