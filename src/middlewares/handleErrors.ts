import { Request, Response, NextFunction } from "express";
import { StatusCodes } from "http-status-codes";
import { Prisma } from "@prisma/client";

export const errorHandler = (
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  if (res.headersSent) {
    return; // si la réponse est déjà envoyée
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    switch (err.code) {
      case "P2002":
        return res.status(StatusCodes.CONFLICT).json({
          success: false,
          message: "Cette ressource existe déjà",
          errorCode: "UNIQUE_CONSTRAINT_FAILED",
        });
      case "P2003":
        return res.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          message: "Clé étrangère invalide",
          errorCode: "FOREIGN_KEY_CONSTRAINT_FAILED",
        });
      case "P2025":
        return res.status(StatusCodes.NOT_FOUND).json({
          success: false,
          message: "Ressource introuvable",
          errorCode: "RESOURCE_NOT_FOUND",
        });
    }
  }

  console.error("Unhandled server error:", err);
  return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
    success: false,
    message: "Erreur serveur interne",
  });
};
