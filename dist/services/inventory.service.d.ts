import { Prisma } from "@prisma/client";
/**
 * Service gérant la logique de stock des produits (incrémentation, décrémentation, vérification)
 */
export declare class InventoryService {
    static decrementStock<T extends Prisma.OrderGetPayload<{
        include: {
            items: {
                include: {
                    product: {
                        select: {
                            id: true;
                            title: true;
                        };
                    };
                    variant: {
                        select: {
                            id: true;
                            stock: true;
                        };
                    };
                };
            };
        };
    }>>(updateOrder: T, tx: Prisma.TransactionClient): Promise<void>;
    static incrementStock(orderId: string, tx: Prisma.TransactionClient): Promise<void>;
    /**
     * Vérifie si tous les produits d'une commande ont un stock suffisant avant validation.
     * @param orderId - ID de la commande
     * @returns true si stock suffisant, sinon false
     */
    static hasSufficientStock(orderId: string): Promise<boolean>;
    /**
     * Vérifie si une variante spécifique a un stock suffisant
     * @param variantId - ID de la variante
     * @param quantity - quantité demandée
     */
    static checkVariantStock(variantId: string, quantity: number): Promise<boolean>;
}
