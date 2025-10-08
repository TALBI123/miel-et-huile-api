import { Prisma, PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
/**
 * Service gérant la logique de stock des produits (incrémentation, décrémentation, vérification)
 */
export class InventoryService {
  static async decrementStock<
    T extends Prisma.OrderGetPayload<{
      include: {
        items: {
          include: {
            product: { select: { id: true; title: true } };
            variant: { select: { id: true; stock: true } };
          };
        };
      };
    }>
  >(updateOrder: T, tx: Prisma.TransactionClient): Promise<void> {
    for (const item of updateOrder.items) {
      if (item.variant) {
        if (item.variant.stock < item.quantity)
          throw new Error(
            `Stock insuffisant pour le variant ${item.variant.id}`
          );
        await tx.productVariant.update({
          where: { id: item.variantId! },
          data: {
            stock: {
              decrement: item.quantity,
            },
          },
        });
        console.log(`📦 Stock mis à jour pour variant ${item.variant.id}`, {
          variantId: item.variant.id,
          previousStock: item.variant.stock,
          newStock: item.variant.stock - item.quantity,
          quantity: item.quantity,
        });
      }
    }
  }
  // static async decrementStock(
  //   orderId: string,
  //   tx: Prisma.TransactionClient
  // ): Promise<void> {
  //   const items = await prisma.orderItem.findMany({
  //     where: { orderId },
  //   });
  //   await Promise.all(
  //     items.map((item) =>
  //       tx.productVariant.update({
  //         where: { id: item.variantId },
  //         data: { stock: { decrement: item.quantity } },
  //       })
  //     )
  //   );
  // }
  static async incrementStock(
    orderId: string,
    tx: Prisma.TransactionClient
  ): Promise<void> {
    const items = await tx.orderItem.findMany({ where: { orderId } });

    await Promise.all(
      items.map((item) =>
        tx.productVariant.update({
          where: { id: item.variantId },
          data: { stock: { increment: item.quantity } },
        })
      )
    );
  }

  /**
   * Vérifie si tous les produits d'une commande ont un stock suffisant avant validation.
   * @param orderId - ID de la commande
   * @returns true si stock suffisant, sinon false
   */
  static async hasSufficientStock(orderId: string): Promise<boolean> {
    const result = await prisma.$queryRaw<{ insufficient: number }[]>`
        SELECT COUNT(*) AS insufficient FROM "OrderItem" oi
        JOIN "ProductVariant" pv ON oi."variantId" = pv.id
        WHERE oi."orderId" = ${orderId} AND pv.stock < oi.quantity
   `;
    return !result[0].insufficient;
  }

  /**
   * Vérifie si une variante spécifique a un stock suffisant
   * @param variantId - ID de la variante
   * @param quantity - quantité demandée
   */
  static async checkVariantStock(variantId: string, quantity: number) {
    const variant = await prisma.productVariant.findUnique({
      where: { id: variantId },
    });
    if (!variant) throw new Error("Variant not found");
    return variant.stock >= quantity;
  }
}
