"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductVariantService = void 0;
const client_1 = require("@prisma/client");
const crypto_1 = __importDefault(require("crypto"));
const helpers_1 = require("../utils/helpers");
class ProductVariantService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    static getInstance(prisma) {
        if (!this.instance)
            this.instance = new ProductVariantService(prisma);
        return this.instance;
    }
    /**
     * 🔍 Validation des données selon le type de produit
     */
    /**
     * 🔍 Vérifier si le SKU existe déjà
     */
    async getExistingProduct({ key, id, select, }) {
        const existingProduct = await this.prisma.product.findUnique({
            where: { id },
            select: select || {
                category: { select: { id: true, isActive: true } },
                isActive: true,
                ...(key !== undefined ? { [key]: true } : {}),
            },
        });
        return existingProduct;
    }
    async getProductVariantById(id, select) {
        const variant = await this.prisma.productVariant.findFirst({
            where: { id },
            select: select.length
                ? Object.fromEntries(select.map((key) => [key, true]))
                : undefined,
        });
        return variant;
    }
    async skuExists(sku) {
        const existing = await this.prisma.productVariant.findUnique({
            where: { sku },
            select: { id: true },
        });
        return !!existing;
    }
    generateSKU(options) {
        const { productType, title, unit, size, amount } = options;
        const typeCode = productType.slice(0, 3).toUpperCase();
        const isGreaterThanWord = Number(title.trim().split(" ").length > 1);
        const titleCode = title.split(" ")[isGreaterThanWord].slice(0, 2).toUpperCase() || "XX ";
        const sizeCode = size ? size.toUpperCase() : "XX";
        const unitCode = unit ? unit.toUpperCase() : "XX";
        const PartialSKU = productType === client_1.ProductType.HONEY
            ? `${amount ?? 0}${unitCode}`
            : sizeCode;
        const shortHash = this.generateShortHash(`${title}-${PartialSKU}-${crypto_1.default.randomUUID()}`);
        return `${typeCode}-${titleCode}-${PartialSKU}-${shortHash}`;
    }
    generateUniqueName(name) {
        const slug = (0, helpers_1.generateSlug)(name, false).split("-").slice(0, 2).join("-");
        const shortHash = this.generateShortHash(`${name}-${crypto_1.default.randomUUID()}`);
        return `variant-${slug}-${shortHash}`;
    }
    generateShortHash(input, len = 4) {
        return crypto_1.default
            .createHash("md5")
            .update(input)
            .digest("hex")
            .slice(0, len)
            .toUpperCase();
    }
}
exports.ProductVariantService = ProductVariantService;
//# sourceMappingURL=productVariant.service.js.map