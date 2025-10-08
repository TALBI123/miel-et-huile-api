import { OrderItem, PrismaClient } from "@prisma/client";
import { ApiResponse } from "../types/type";
const prisma = new PrismaClient();
export class ProductValidationService {
  static async validateItems(items: OrderItem[]) {
    console.log("Validating items:", items);
    if (!items || items.length === 0)
      return {
        success: false,
        message: "Le panier est vide",
        data: { data: { invalidItems: [] } },
      };
    const products = await prisma.productVariant.findMany({
      where: {
        id: { in: items.map((variant) => variant.variantId) },
      },
      include: { product: true },
    });
    const variantMap = new Map(
      products.map((variant) => [variant.id, variant])
    );
    let invalidItems = [];
    for (const item of items) {
      const variant = variantMap.get(item.variantId);

      if (!variant) {
        invalidItems.push({
          productTitle: "Produit inconnu",
          variantId: item.variantId,
          requestedQuantity: item.quantity,
          availableStock: 0,
          reason: "Variant introuvable",
        });
        continue;
      }
      if (!variant.product) {
        invalidItems.push({
          productTitle: "Produit supprimé",
          variantId: item.variantId,
          requestedQuantity: item.quantity,
          availableStock: 0,
          reason: "Produit non trouvé ou supprimé",
        });
        continue;
      }
      console.log(variant);
      if (variant.stock < item.quantity)
        invalidItems.push({
          productTitle: variant.product.title,
          variantId: variant.id,
          requestedQuantity: item.quantity,
          availableStock: variant.stock,
          reason: "Stock insuffisant",
        });
    }
    if (invalidItems.length > 0) {
      return {
        success: false,
        message:
          "Certains articles du panier sont invalides ou en rupture de stock.",
        data: { invalidItems },
      };
    }

    return {
      success: true,
      message: "Tous les articles sont valides et en stock.",
      data: { invalidItems: [] },
    };
  }
}
