import { OrderItem, PrismaClient } from "@prisma/client";
import { Request, Response, NextFunction } from "express";
import { StatusCodes } from "http-status-codes";
const prisma = new PrismaClient();

export const validateOrderItems = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { items } = req.body;

  // Validation de base des items
  if (!items || !Array.isArray(items) || items.length === 0)
    return res.status(StatusCodes.BAD_REQUEST).json({
      success: false,
      message: "La liste des articles est requise et ne peut pas être vide",
      code: "INVALID_ITEMS_ARRAY",
    });

  // Validation de la limite d'articles (éviter les abus)
  if (items.length > 50)
    return res.status(StatusCodes.BAD_REQUEST).json({
      success: false,
      message: "Nombre maximum d'articles dépassé (50 maximum)",
      code: "TOO_MANY_ITEMS",
    });
  // Validation détaillée de chaque item
  const itemsMap = new Map<string, OrderItem>(
    items.map((item: OrderItem) => [item.productId, item])
  );
  const products = await prisma.product.findMany({
    where: { id: { in: items.map((item) => item.productId) } },
    include: { variants: true },
  });
  // 3. Détection des erreurs
  const invalidItems = [];

  for (const product of products) {
    const orderItem = itemsMap.get(product.id);
    if (!orderItem) {
      invalidItems.push({
        productId: product.id,
        title: product.title,
        reason: "Produit non trouvé",
      });
      continue;
    }

    const variant = product.variants.find((v) => v.id === orderItem.variantId);
    if (!variant)
      invalidItems.push({
        productId: product.id,
        reason: "Variant non trouvé",
      });
    else if (variant.stock < orderItem.quantity)
      invalidItems.push({
        productId: product.id,
        reason: "Stock insuffisant",
      });
  }

  // 4. Retour d’erreurs global
  if (invalidItems.length)
    return res.status(StatusCodes.BAD_REQUEST).json({
      success: false,
      message: "Certains articles ne sont pas valides",
      invalidItems,
    });
  next();
};
