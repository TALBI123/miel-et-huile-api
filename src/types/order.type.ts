import { Prisma } from "@prisma/client";
import { Product, ProductVariant } from "./type";

export type OrderWithRelations = Prisma.OrderGetPayload<{
  include: {
    user: { select: { firstName: true; lastName: true } };
    items: {
      include: {
        product: { include: { images: true } };
        variant: {
          select: {
            price: true;
            stock: true;
            discountPrice: true;
            isOnSale: true;
          };
        };
      };
    };
  };
}>;
export interface CartItem {
  productId: string;
  variantId: string;
  quantity: number;
  product?: Product;
  variant?: ProductVariant;
}
export interface Order {
  userId: string;
  totalAmount: number;
  items: CartItem[];
}
export interface OrderItem {
  productId: string;
  variantId?: string;
  quantity: number;
}
