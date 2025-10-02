import { Prisma, } from "@prisma/client";
import { Product, ProductVariant } from "./type";

export type OrderWithRelations = Prisma.OrderGetPayload<{
  include: {
    items: {
      include: {
        product: { include: { images: true } };
        variant: true;
      };
    };
  };
}>;
export interface CartItem {
  productId: string;
  variantId: string; 
  quantity: number;
  product? : Product;
  variant? : ProductVariant;

}
export interface Order{
  userId : string;
  totalAmount:number;
  items : CartItem[];
}