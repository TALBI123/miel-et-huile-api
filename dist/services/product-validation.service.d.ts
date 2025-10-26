import { OrderItem } from "@prisma/client";
export declare class ProductValidationService {
    /**✅ 2. Valide les articles du panier avant la création d’une commande */
    static validateItems(items: OrderItem[]): Promise<{
        success: boolean;
        message: string;
        data: {
            data: {
                invalidItems: never[];
            };
            invalidItems?: undefined;
        };
    } | {
        success: boolean;
        message: string;
        data: {
            invalidItems: ({
                productTitle: string;
                variantId: string;
                requestedQuantity: number;
                availableStock: number;
                reason: string;
                title?: undefined;
            } | {
                productTitle: string;
                title: string;
                variantId: string;
                requestedQuantity: number;
                availableStock: number;
                reason: string;
            })[];
            data?: undefined;
        };
    }>;
}
