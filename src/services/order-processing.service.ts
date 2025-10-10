import { OrderStatus, PaymentStatus, PrismaClient } from "@prisma/client";
import { CartItem, OrderWithRelations } from "../types/order.type";
import { sendEmail } from "./emailService.service";
import { createOrderData } from "../utils/object";
import { generateToken } from "../utils/helpers";
import { Stripe } from "../config/stripe";
import { InventoryService } from "./inventory.service";
const prisma = new PrismaClient();

interface ProcessOrder {
  orderId: string;
  email: string;
  customerName: string | undefined;
  session: Stripe.Checkout.Session;
  order: any;
}
export class OrderProcessingService {
  /**
   * Traitement principal de confirmation de commande
   */
  static async processOrderConfirmation({
    orderId,
    email,
    customerName,
    session,
    order,
  }: ProcessOrder) {
    // Vérification d'idempotence
    if (order.paymentStatus === "PAID") {
      console.warn(`⚠️ Commande ${orderId} déjà traitée`, {
        sessionId: session.id,
        currentStatus: order.paymentStatus,
      });
      return order;
    }

    // Transaction atomique avec retry logic
    const confirmedOrder = await this.executeOrderConfirmationTransaction(
      orderId,
      session
    );
    console.log(`✅ Commande ${orderId} confirmée avec succès`);
    // Actions post-confirmation (non-bloquantes)
    this.executePostConfirmationActions(
      orderId,
      email,
      customerName,
      confirmedOrder
    );
    return confirmedOrder;
  }
  /**
   * Créer une nouvelle commande
   */
  static async createOrder(
    userId: string,
    cart: CartItem[],
    shippingCost : number
  ): Promise<OrderWithRelations> {
    const productVariants = await prisma.productVariant.findMany({
      where: { id: { in: cart.map((item) => item.variantId) } },
    });
    let totalAmount: number = shippingCost;
    const productVariantsMap = new Map(productVariants.map((p) => [p.id, p]));
    const items = cart.map((item) => {
      const productVariant = productVariantsMap.get(item.variantId);
      if (!productVariant)
        throw new Error(
          `createOrder (OPS) :  Le produit avec l’ID ${item.variantId} n’existe plus. Veuillez choisir un autre variant.`
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
            id: `cmd-${generateToken()}`,
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
  }
  /**
   * Transaction atomique pour la confirmation de commande
   */
  static async executeOrderConfirmationTransaction(
    orderId: string,
    session: Stripe.Checkout.Session
  ) {
    const maxRetries = 3;
    let retryCount = 0;

    while (retryCount < maxRetries) {
      try {
        return await prisma.$transaction(async (tx) => {
          // 🔒 Verrou explicite sur la commande
          const [order] = await tx.$queryRawUnsafe<any[]>(
            `SELECT * FROM "Order" WHERE id = $1 FOR UPDATE`,
            orderId
          );
          if (!order) throw new Error("Order not found");
          if (order.status === "CONFIRMED") return order; // ✅ déjà confirmé, rien à faire
          // Vérification de cohérence des payment_intent
          if (
            order.stripePaymentIntentId &&
            order.stripePaymentIntentId !== session.payment_intent
          ) {
            console.error(`❌ Incohérence payment_intent`, {
              orderId,
              orderPaymentIntent: order.stripePaymentIntentId,
              sessionPaymentIntent: session.payment_intent,
            });
            throw new Error("Incohérence dans les payment_intent");
          }
          // 1. Mise à jour de la commande
          const updateOrder = await tx.order.update({
            where: { id: orderId },
            data: {
              status: OrderStatus.CONFIRMED,
              paymentStatus: PaymentStatus.PAID,
              stripePaymentIntentId: session.payment_intent as string,
              notes: `Traité par webhook ${
                session.id
              } à ${new Date().toISOString()}`,
            },
            include: {
              items: {
                include: {
                  product: { select: { id: true, title: true } },
                  variant: { select: { id: true, stock: true } },
                },
              },
            },
          });
          // 2. Mise à jour du stock pour chaque item
          await InventoryService.decrementStock(updateOrder, tx);
          // Log détaillé pour monitoring
          console.log(`📦 Stock mis à jour pour commande ${orderId}`);
          return updateOrder;
        });
      } catch (err: any) {
        const transientErrors = [
          "deadlock",
          "serialization",
          "timeout",
          "lock",
        ];

        // Vérifie si l’erreur est "transiente" (temporaire)
        const isTransientError = transientErrors.some((word) =>
          err.message.toLowerCase().includes(word)
        );

        if (isTransientError && retryCount < maxRetries - 1) {
          retryCount++;
          const delay = Math.pow(2, retryCount) * 500; // backoff exponentiel
          console.warn(
            `⚠️ Retry #${retryCount} après ${delay}ms pour cause : ${err.message}`
          );
          await new Promise((res) => setTimeout(res, delay));
        } else {
          // ❌ Erreur métier → pas de retry
          throw new Error(
            `Transaction échouée après ${retryCount} tentative(s) : ${err.message}`
          );
        }
      }
    }
  }

  /**
   * Actions post-confirmation non-bloquantes
   */
  static async executePostConfirmationActions(
    orderId: string,
    email: string,
    customerName: string | undefined,
    order: any
  ) {
    // Exécution asynchrone pour ne pas bloquer la réponse webhook
    this.runInBackground(async () => {
      try {
        // 1. Envoi email de confirmation
        await this.sendConfirmationEmailSafely(
          orderId,
          email,
          customerName,
          order
        );
        if (order.totalAmount > 1000) {
          await this.notifyTeamLargeOrder(order);
        }

        // 3. Log de succès pour monitoring
        console.log(
          `🎉 Actions post-confirmation terminées pour commande ${orderId}`,
          {
            orderId,
            email,
            amount: order.totalAmount,
            itemsCount: order.items?.length || 0,
          }
        );
      } catch (error) {
        console.error(`⚠️ Erreur actions post-confirmation`, {
          orderId,
          error: error instanceof Error ? error.message : error,
        });
      }
    });
  }

  /**
   * Créer une commande d'urgence en cas de paiement sans commande
   */
  static async createEmergencyOrder(session: Stripe.Checkout.Session) {
    console.error(`🚨🚨 SITUATION CRITIQUE: Paiement sans commande`, {
      sessionId: session.id,
      paymentIntentId: session.payment_intent,
      amount: session.amount_total,
      customerEmail: session.customer_details?.email,
    });
    try {
      const emergencyOrder = await prisma.order.create({
        data: {
          id: `emergency-${session.id.slice(-8)}-${Date.now()}`,
          paymentStatus: "PAID",
          status: "REQUIRES_MANUAL_REVIEW" as any, // Vous devrez ajouter ce statut à votre enum
          stripePaymentIntentId: session.payment_intent as string,
          totalAmount: (session.amount_total || 0) / 100,
          userId: "emergency-user", // Utilisateur par défaut pour les urgences
          notes: `🚨 COMMANDE D'URGENCE - Paiement réussi sans commande originale.
                  SessionId: ${session.id}
                  Customer: ${session.customer_details?.email || "N/A"}
                  Amount: ${session.amount_total}
                  PaymentIntent: ${session.payment_intent}
                  Timestamp: ${new Date().toISOString()}`,
          // Pas d'items pour les commandes d'urgence - géré manuellement
        },
      });

      console.log(`📋 Commande d'urgence créée: ${emergencyOrder.id}`);
      // Notification IMMÉDIATE à l'équipe
      await this.notifyTeamCriticalIssue(session, emergencyOrder.id);

      return emergencyOrder;
    } catch (err) {
      console.error(`🚨 Impossible de créer commande d'urgence`, {
        error: err instanceof Error ? err.message : err,
        sessionId: session.id,
      });
      throw err;
    }
  }

  /**
   * Recherche d'une commande par payment_intent
   */
  static async findOrderByPaymentIntent(paymentIntentId: string) {
    return await prisma.order.findFirst({
      where: { stripePaymentIntentId: paymentIntentId },
      select: {
        paymentStatus: true,
        stripePaymentIntentId: true,
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        items: {
          include: {
            product: { select: { id: true, title: true } },
            variant: { select: { id: true, stock: true } },
          },
        },
      },
    });
  }
  /**
   * Obtenir le nom complet du client avec fallback
   */
  static getCustomerName(user: any, fallbackName?: string): string {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    if (user?.firstName) {
      return user.firstName;
    }
    return fallbackName || "Client";
  }

  /**
   * Notification équipe pour intervention manuelle 💡
   */
  static async notifyTeamCriticalIssue(
    session: Stripe.Checkout.Session,
    orderId: string
  ) {
    // const orderId = session.metadata?.orderId;
    try {
      await sendEmail({
        to: process.env.ADMIN_EMAIL || "admin@votresite.com",
        subject: "🚨 INTERVENTION REQUISE - Problème commande/paiement",
        htmlFileName: "critical-alert.ejs",
        context: {
          orderId: orderId || "N/A",
          sessionId: session.id,
          paymentIntentId: session.payment_intent,
          amount: session.amount_total,
          customerEmail: session.customer_details?.email,
          timestamp: new Date().toISOString(),
        },
      });

      console.log(`🚨 Notification équipe envoyée`, {
        sessionId: session.id,
        orderId,
      });
    } catch (error) {
      console.error(`❌ Échec notification équipe`, {
        error: error instanceof Error ? error.message : error,
        sessionId: session.id,
      });
    }
  }
  /**
   * Notification pour commandes importantes
   */
  static async notifyTeamLargeOrder(order: any) {
    try {
      await sendEmail({
        to: process.env.ADMIN_EMAIL || "admin@votresite.com",
        subject: `💰 Commande importante reçue - ${order.totalAmount}€`,
        htmlFileName: "large-order-notification.ejs",
        context: {
          orderId: order.id,
          amount: order.totalAmount,
          customerEmail: order.user?.email,
          customerName: this.getCustomerName(order.user),
          itemsCount: order.items?.length || 0,
          timestamp: new Date().toISOString(),
        },
      });

      console.log(`💰 Notification commande importante envoyée`, {
        orderId: order.id,
        amount: order.totalAmount,
      });
    } catch (error) {
      console.error(`❌ Échec notification commande importante`, {
        orderId: order.id,
        error: error instanceof Error ? error.message : error,
      });
    }
  }
  /**
   * Envoi d'email de confirmation sécurisé
   */
  static async sendConfirmationEmailSafely(
    orderId: string,
    email: string,
    customerName: string | undefined,
    order: any
  ) {
    try {
      const orderData = createOrderData({
        customerEmail: email,
        customerName: customerName || this.getCustomerName(order.user),
        items:
          order.items?.map((item: any) => ({
            title: item.product?.title || "Produit",
            quantity: item.quantity,
            price: item.price,
          })) || [],
      });
      await sendEmail({
        to: email,
        subject: `✅ Confirmation de commande - ${order.id}`,
        htmlFileName: "order-confirmation.ejs",
        context: orderData,
      });

      console.log(`✅ Email de confirmation envoyé`, {
        orderId: order.id,
        email,
      });
    } catch (error) {
      console.error(`❌ Échec envoi email de confirmation`, {
        orderId: order.id,
        email,
        error: error instanceof Error ? error.message : error,
      });
    }
  }
  static runInBackground(fn: () => Promise<void>) {
    setImmediate(() => {
      fn().catch((error) => console.error("Erreur background task:", error));
    });
  }
  static async resolveOrder(session: Stripe.Checkout.Session) {
    const { orderId } = session.metadata || {};
    const paymentIntentId = session.payment_intent as string;
    // Essaye d'abord via paymentIntent
    let order = await OrderProcessingService.findOrderByPaymentIntent(
      paymentIntentId
    );

    // Si pas trouvé, essaye via orderId
    if (!order && orderId) {
      order = await prisma.order.findUnique({
        where: { id: orderId },
        include: {
          user: {
            select: { id: true, email: true, firstName: true, lastName: true },
          },
          items: {
            include: {
              product: { select: { id: true, title: true } },
              variant: { select: { id: true, stock: true } },
            },
          },
        },
      });
    }
    return order;
  }
}
