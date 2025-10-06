import { Prisma, PrismaClient } from "@prisma/client";
import { CartItem, OrderWithRelations } from "../types/order.type";
const prisma = new PrismaClient();

export const createOrder = async (
  userId: string,
  cart: CartItem[]
): Promise<OrderWithRelations> => {
  const productVariants = await prisma.productVariant.findMany({
    where: { id: { in: cart.map((item) => item.variantId) } },
  });
  let totalAmount: number = 0;
  const productVariantsMap = new Map(productVariants.map((p) => [p.id, p]));
  const items = cart.map((item) => {
    const productVariant = productVariantsMap.get(item.variantId);
    if (!productVariant)
      throw new Error(
        `Le produit avec l’ID ${item.variantId} n’existe plus. Veuillez choisir un autre variant.`
      );

    const price = productVariant?.isOnSale
      ? productVariant.discountPrice
      : productVariant?.price;
    totalAmount += price! * item.quantity;
    return {
      productId: item.productId,
      variantId: item.variantId,
      quantity: item.quantity,
      price: price!,
    };
  });

  return prisma.$transaction(
    async (tx) => {
      console.log("Total Amount: ", totalAmount);
      const order = await tx.order.create({
        data: {
          userId,
          totalAmount,
          status: "PENDING",
          paymentStatus: "PENDING",
          items: {
            create: items,
          },
        },
        include: {
          user: { select: { firstName: true, lastName: true } },
          items: {
            include: {
              product: { include: { images: true } },
              variant: {
                select: {
                  price: true,
                  stock: true,
                  discountPrice: true,
                  isOnSale: true,
                },
              },
            },
          },
        },
      });
      return order;
    },
    { timeout: 10000 }
  );
};
