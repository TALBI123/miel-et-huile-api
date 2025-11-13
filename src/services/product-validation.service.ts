import { OrderItem, ProductType, ClothingSize } from "@prisma/client";
import prisma from "../config/db";

export class ProductValidationService {
  /**✅ 2. Valide les articles du panier avant la création d’une commande */
  static PRODUCT_BASE_WEIGHT_CLOTHING: Record<ClothingSize, number> = {
    // [ClothingSize.X]: 0.7,
    [ClothingSize.S]: 0.15,
    [ClothingSize.M]: 0.18,
    [ClothingSize.L]: 0.22,
    [ClothingSize.XL]: 0.26,
    [ClothingSize.XXL]: 0.3,
  };
  static async validateItems(items: OrderItem[]) {
    // console.log("Validating items:", items);
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
      include: { product: { select: { title: true, productType: true } } },
    });
    const variantMap = new Map(
      products.map((variant) => [variant.id, variant])
    );
    let invalidItems = [];
    let totalWeight = 0;
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
      // console.log(variant);
      if (variant.stock < item.quantity)
        invalidItems.push({
          productTitle: variant.product.title,
          title: variant.product.title,
          variantId: variant.id,
          requestedQuantity: item.quantity,
          availableStock: variant.stock,
          reason: "Stock insuffisant",
        });

      const isClouthing = variant.product.productType === ProductType.CLOTHING;
      let weight = 0;
      if (isClouthing)
        weight =
          variant.unit === "g" ? variant.amount! / 1000 : variant.amount!;
      else weight = this.PRODUCT_BASE_WEIGHT_CLOTHING[variant.size!] || 0;
      totalWeight += weight * item.quantity;
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
      data: {
        invalidItems: [],
        summary: {
          totalWeight,
        },
      },
      totalWeight,
    };
  }
}
