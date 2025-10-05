import { OrderStatus, PrismaClient } from "@prisma/client";
import { stripe, Stripe } from "../config/stripe";
import { sendEmail } from "./emailService.service";

const prisma = new PrismaClient();

export class WebhookService {
  private static async updateStockAndConfirmOrder(orderId: string) {
    try {
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: { items: { include: { variant: true } } },
      });
      if (!order) throw new Error(`Order with ID ${orderId} not found`);

      console.log("✅ Stock mis à jour et commande confirmée");
    } catch (err) {
      console.error("❌ Erreur mise à jour stock/confirmation commande:", err);
    }
  }
  static async handleCheckoutSessionCompleted(
    session: Stripe.Checkout.Session
  ) {
    try {
      const orderId = session.metadata?.orderId;
      console.log(" ------ Session Metadata:", session.metadata);
      if (!orderId) {
        console.error("❌ No orderId found in session metadata");
        return;
      }
      console.log("💰 Transaction Stripe:", session.payment_intent);

      await prisma.order.update({
        where: { id: orderId },
        data: {
          paymentStatus: "PAID",
          status: OrderStatus.CONFIRMED,
          // paymentMethod: session.payment_method_types?.[0] || "CARD",
          stripePaymentIntentId: session.payment_intent as string,
        },
      });
      console.log(`✅ Commande ${orderId} marquée comme payée`);
      // Ici vous pouvez ajouter :
      // - Envoyer un email de confirmation
      // - Mettre à jour le stock
      // - Notifier l'équipe
    } catch (err) {
      console.error("Error handling checkout.session.completed:", err);
      throw err;
    }
  }
  static async handlePaymentFailed(
    session: Stripe.PaymentIntent | Stripe.Checkout.Session
  ) {
    try {
      // if ('payment_intent' in session) {
      // La tentative de paiement a échoué
      console.log("❌ Paiement échoué");
      const orderId = session.metadata?.orderId;
      if (orderId) {
        await prisma.order.update({
          where: { id: orderId },
          data: { paymentStatus: "FAILED", status:OrderStatus.CANCELED },
        });
      }
      console.log(`❌ Commande ${orderId} marquée comme échouée`);
      // }
    } catch (error) {
      console.error("❌ Erreur traitement payment failed:", error);
    }
  }
  static async handlePaymentIntentSucceeded(session: Stripe.PaymentIntent) {
    try {
      const orderId = session.metadata?.orderId;
      if (orderId) {
        await prisma.order.update({
          where: { id: orderId },
          data: { paymentStatus: "PAID", status: OrderStatus.CONFIRMED },
        });
        console.log(`✅ Commande ${orderId} marquée comme réussie`);
      }
    } catch (error) {
      console.error("❌ Erreur traitement payment succeeded:", error);
    }
  }
  // static async handlePaymentRequiresAction(session: Stripe.PaymentIntent) {
  //   try {
  //     const orderId = session.metadata?.orderId;
  //     if (orderId) {
  //       await prisma.order.update({
  //         where: { id: orderId },
  //         data: { paymentStatus: "REQUIRES_ACTION", status: "PENDING" },
  //       });
  //       console.log(`🔄 Commande ${orderId} nécessite une action`);
  //     }
  //   } catch (error) {
  //     console.error("❌ Erreur traitement payment requires action:", error);
  //   }
  // }
  static async handlePaymentCanceled(session: Stripe.PaymentIntent) {
    try {
      const orderId = session.metadata?.orderId;
      if (orderId) {
        await prisma.order.update({
          where: { id: orderId },
          data: { paymentStatus: "FAILED", status: OrderStatus.CANCELED},
        });
        console.log(`❌ Commande ${orderId} annulée`);
      }
    } catch (error) {
      console.error("❌ Erreur traitement payment canceled:", error);
    }
  }
  static async handleDisputeCreated(session: Stripe.Dispute) {
    try {
      const orderId = session.metadata?.orderId;
      if (orderId) {
        await prisma.order.update({
          where: { id: orderId },
          data: { paymentStatus: "DISPUTED", status: "PENDING" },
        });
        console.log(`⚠️ Commande ${orderId} en litige`);
      }
    } catch (error) {
      console.error("❌ Erreur traitement dispute created:", error);
    }
  }
  static async handleSessionExpired(session: Stripe.Checkout.Session) {
    try {
      const orderId = session.metadata?.orderId;
      if (orderId) {
        await prisma.order.update({
          where: { id: orderId },
          data: { paymentStatus: "EXPIRED", status: OrderStatus.CANCELED },
        });
        console.log(`⏰ Commande ${orderId} expirée`);
      }
    } catch (error) {
      console.error("❌ Erreur traitement session expired:", error);
    }
  }
  static async handleChargeRefunded(refund: Stripe.Charge) {
    try {
      const paymentIntentId = refund.payment_intent as string;
      const existingOrder = await prisma.order.findFirst({
        where: {
          stripePaymentIntentId: paymentIntentId,
          paymentStatus: "REFUNDED",
        },
        select: { stripePaymentIntentId: true },
      });
      if (existingOrder) {
        console.log("Remboursement déjà traité");
        return;
      }

      await prisma.order.update({
        where: { stripePaymentIntentId: paymentIntentId },
        data: { paymentStatus: "REFUNDED", status: OrderStatus.CANCELED },
      });
      console.log(
        `↩️ Commande avec PaymentIntent ${paymentIntentId} remboursée`
      );
    } catch (err) {
      console.error("Erreur handleChargeRefunded:", err);
    }
  }

  private static async sendCustomRefundEmail(paymentIntentId: string) {
    const order = await prisma.order.findFirst({
      where: { stripePaymentIntentId: paymentIntentId },
      include: { user: true },
    });

    if (!order) return;

    // Votre email avec votre branding
    // await sendEmail({
    //   to: order.user.email,
    //   subject: '💰 Remboursement effectué',
    //   html: `
    //     <div style="votre-design">
    //       <h1>Cher ${order.user.name},</h1>
    //       <p>Votre remboursement de <strong>${order.amount}€</strong> est confirmé.</p>
    //       <a href="https://votresite.com">Retourner sur notre site</a>
    //     </div>
    //   `
    // });
  }
}