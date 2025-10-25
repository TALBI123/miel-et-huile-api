import { ProductType } from "@prisma/client";
import prisma from "../config/db";
export class ProductVariantService {
  /**
   * 🔍 Validation des données selon le type de produit
   */
  /**
   * 🔍 Vérifier si le SKU existe déjà
   */
  private static async skuExists(sku: string): Promise<boolean> {
    const existing = await prisma.productVariant.findUnique({
      where: { sku },
      select: { id: true },
    });
    return !!existing;
  }
  /**   * 🆔 Génération d'un SKU unique basé sur le type de produit et ses attributs
   */
  // static generateSKU(
  //   productId: string,
  //   productType: ProductType,
  //   variantData: any
  // ): string {
  //   const productPrefix = productId.slice(-4).toUpperCase();
  //   const typePrefix = productType.substring(0, 2).toUpperCase();

  //   switch (productType) {
  //     case ProductType.HONEY:
  //       return `${typePrefix}-${productPrefix}-${
  //         variantData.amount
  //       }${this.getUnitSymbol(variantData.unit)}`;

  //     case ProductType.CLOTHING:
  //       return `${typePrefix}-${productPrefix}-${variantData.size || "OS"}-${
  //         variantData.color?.substring(0, 3).toUpperCase() || "DEF"
  //       }`;

  //     case ProductType.DATES:
  //       return `${typePrefix}-${productPrefix}-${
  //         variantData.amount
  //       }${this.getUnitSymbol(variantData.unit)}`;

  //     default:
  //       return `${typePrefix}-${productPrefix}-${Date.now()}`;
  //   }
  // }
}
