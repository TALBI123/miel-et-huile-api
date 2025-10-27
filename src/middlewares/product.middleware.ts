import { Request, Response, NextFunction } from "express";
import prisma from "../config/db";
export const getProductTypeMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { id } = req.params;
  if (id) {
    const productType = await prisma.product.findUnique({
      where: { id },
      select: { productType: true },
    });
    console.log("🔧 ", productType, " productType");
    res.locals.validated = {
      ...req.body,
      productType: productType?.productType,
    };
  }
  next();
};
