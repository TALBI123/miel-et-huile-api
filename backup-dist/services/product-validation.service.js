"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductValidationService = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
class ProductValidationService {
    /**✅ 2. Valide les articles du panier avant la création d’une commande */
    static async validateItems(items) {
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
            include: { product: { select: { title: true } } },
        });
        const variantMap = new Map(products.map((variant) => [variant.id, variant]));
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
        }
        if (invalidItems.length > 0) {
            return {
                success: false,
                message: "Certains articles du panier sont invalides ou en rupture de stock.",
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
exports.ProductValidationService = ProductValidationService;
//# sourceMappingURL=product-validation.service.js.map