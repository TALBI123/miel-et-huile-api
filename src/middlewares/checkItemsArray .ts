import { OrderItem, PrismaClient } from "@prisma/client";
import { Request, Response, NextFunction } from "express";
import { StatusCodes } from "http-status-codes";
const prisma = new PrismaClient();

export const checkItemsArray  = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { items } = req.body;
  if (!items || !Array.isArray(items) || items.length === 0)
    return res.status(400).json({ success: false, message: "Items requis" });

  if (items.length > 50)
    return res.status(400).json({ success: false, message: "Max 50 items" });

  next();
};
