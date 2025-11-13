import { PrismaClient, ProductType, ProductVariant } from "@prisma/client";
import { ProductWithCategory } from "../types/prisma.type";
import { AllowedTypeSizes, AllowedTypeUnits } from "../data/allowedNames";
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
export declare class ProductVariantService {
    private prisma;
    constructor(prisma: PrismaClient);
    private static instance;
    static getInstance(prisma: PrismaClient): ProductVariantService;
    /**
     * 🔍 Validation des données selon le type de produit
     */
    /**
     * 🔍 Vérifier si le SKU existe déjà
     */
    getExistingProduct({ key, id, select, }: GetExistingProductParams): Promise<ProductWithCategory | null>;
    getProductVariantById<K extends keyof ProductVariant>(id: string, select: K[]): Promise<K extends undefined ? ProductVariant : Pick<ProductVariant, K> | null>;
    skuExists(sku: string): Promise<boolean>;
    generateSKU(options: GenerateSKUOptions): string;
    generateUniqueName(name: string): string;
    generateShortHash(input: string, len?: number): string;
}
export {};
