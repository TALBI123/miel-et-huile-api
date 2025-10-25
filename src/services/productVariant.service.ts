import {
  Prisma,
  PrismaClient,
  ProductType,
  ProductVariant,
} from "@prisma/client";
import { ProductWithCategory } from "../types/prisma.type";
import { AllowedTypeSizes, AllowedTypeUnits } from "../data/allowedNames";
import crypto from "crypto";
import { string } from "zod";
import { generateSlug } from "../utils/helpers";
interface GetExistingProductParams {
  key?: "title";
  id: string;
  select?: Record<string, any>;
}
interface GenerateSKUOptions {
  productType: ProductType;
  title: string;
  unit?: AllowedTypeUnits;
  size?: AllowedTypeSizes;
  amount?: number;
}
export class ProductVariantService {
  constructor(private prisma: PrismaClient) {}

  // Singleton
  private static instance: ProductVariantService;
  static getInstance(prisma: PrismaClient) {
    if (!this.instance) this.instance = new ProductVariantService(prisma);
    return this.instance;
  }
  /**
   * 🔍 Validation des données selon le type de produit
   */
  /**
   * 🔍 Vérifier si le SKU existe déjà
   */
  async getExistingProduct({
    key,
    id,
    select,
  }: GetExistingProductParams): Promise<ProductWithCategory | null> {
    const existingProduct = await this.prisma.product.findUnique({
      where: { id },
      select: select || {
        category: { select: { id: true, isActive: true } },
        isActive: true,
        ...(key !== undefined ? { [key]: true } : {}),
      },
    });
    return existingProduct as any;
  }
  async getProductVariantById<K extends keyof ProductVariant>(
    id: string,
    select: K[]
  ): Promise<
    K extends undefined ? ProductVariant : Pick<ProductVariant, K> | null
  > {
    const variant = await this.prisma.productVariant.findFirst({
      where: { id },
      select: select.length
        ? (Object.fromEntries(select.map((key) => [key, true])) as any)
        : undefined,
    });
    return variant as any;
  }
  async skuExists(sku: string): Promise<boolean> {
    const existing = await this.prisma.productVariant.findUnique({
      where: { sku },
      select: { id: true },
    });
    return !!existing;
  }
  generateSKU(options: GenerateSKUOptions): string {
    const { productType, title, unit, size, amount } = options;
    const typeCode = productType.slice(0, 3).toUpperCase();
    const isGreaterThanWord = Number(title.trim().split(" ").length > 1);
    const titleCode =
      title.split(" ")[isGreaterThanWord].slice(0, 2).toUpperCase() || "XX ";
    const sizeCode = size ? size.toUpperCase() : "XX";
    const unitCode = unit ? unit.toUpperCase() : "XX";
    const PartialSKU =
      productType === ProductType.HONEY
        ? `${amount ?? 0}${unitCode}`
        : sizeCode;
    const shortHash = this.generateShortHash(
      `${title}-${PartialSKU}-${crypto.randomUUID()}`
    );
    return `${typeCode}-${titleCode}-${PartialSKU}-${shortHash}`;
  }
  generateUniqueName(name: string): string {
    const slug = generateSlug(name, false).split("-").slice(0, 2).join("-");
    const shortHash = this.generateShortHash(`${name}-${crypto.randomUUID()}`);

    return `variant-${slug}-${shortHash}`;
  }
  generateShortHash(input: string, len: number = 4): string {
    return crypto
      .createHash("md5")
      .update(input)
      .digest("hex")
      .slice(0, len)
      .toUpperCase();
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
