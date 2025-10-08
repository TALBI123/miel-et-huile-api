import { BlacklistService } from "../services/blacklistService.service";
import { ApiResponse, UserTokenPayload } from "../types/type";
import { NextFunction, Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { ROLE } from "../types/enums";
import jwt from "jsonwebtoken";
const blacklistService = new BlacklistService();
export const verifyToken = (
  req: Request,
  res: Response<ApiResponse>,
  next: NextFunction
) => {
  // console.log(req.cookies," from auth middleware");
  const token = req.cookies?.access_token;
  if (!token)
    return res.status(StatusCodes.UNAUTHORIZED).json({
      success: false,
      message: "Accès non autorisé - Token manquant",
    });
  try {
    if (blacklistService.isTokenBlacklisted(token))
      return res.status(StatusCodes.UNAUTHORIZED).json({
        success: false,
        message: "Accès non autorisé - Token blacklisté",
      });
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET!
    ) as UserTokenPayload;
    req.user = decoded; // TypeScript reconnaîtra maintenant req.user
    next();
  } catch (err) {
    return res
      .status(StatusCodes.UNAUTHORIZED)
      .json({ success: false, message: "Token invalide ou expiré" });
  }
};
export const verifyAdmin = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // console.log(" Accès refusé - Vous n'êtes pas administrateur "+req.user);
  if (req.user?.role !== ROLE.ADMIN) {
    return res.status(StatusCodes.FORBIDDEN).json({
      success: false,
      message: "Accès refusé - Vous n'êtes pas administrateur",
      user : req.user
    });
  }
  next();
};
