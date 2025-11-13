import { ProductVariant } from "../types/type";
export declare const calculateDiscountForVariant: (data: Partial<ProductVariant>) => {
    isOnSale?: boolean;
    discountPercentage?: number;
    discountPrice?: number;
    amount?: number | undefined;
    unit?: string | undefined;
    price?: number | undefined;
    productType?: import(".prisma/client").$Enums.ProductType | undefined;
    size?: string | undefined;
    origin?: string | undefined;
    isActive?: boolean | undefined;
    stock?: number | undefined;
    productId?: string | undefined;
};
export declare const clamp: (n: number, min?: number, max?: number) => number;
