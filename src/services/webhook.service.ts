import { OrderStatus, PrismaClient, PaymentStatus } from "@prisma/client";
import { stripe, Stripe } from "../config/stripe";
import { sendEmail } from "./emailService.service";
import { InventoryService } from "./inventory.service";
import { createOrderData } from "../utils/object";
import { OrderProcessingService } from "./order-processing.service";
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
  /**
   * Handle checkout.session.completed - Version ULTRA ROBUSTE
   */
  static async handleCheckoutSessionCompleted(
    session: Stripe.Checkout.Session
  ) {
    const sessionId = session.id;
    const paymentIntentId = session.payment_intent as string;
    const { orderId, email, customerName } = session.metadata || {};
    if (!orderId) {
      console.error(`🚨 CRITIQUE: orderId manquant mais paiement réussi`, {
        sessionId,
        paymentIntentId,
        metadata: session.metadata,
      });
    }
    try {
      // OrderProcessingService.sendConfirmationEmailSafely(orderId, email, customerName, order);
      // Tentative de récupération par payment_intent
      const order = await OrderProcessingService.resolveOrder(session);
      if (!order) {
        console.error(
          `🚨 CRITIQUE: Commande ${orderId} introuvable mais paiement réussi`,
          {
            orderId,
            sessionId,
            paymentIntentId,
          }
        );
        return await OrderProcessingService.createEmergencyOrder(session);
      }
      await OrderProcessingService.processOrderConfirmation({
        orderId,
        email,
        customerName,
        session,
        order,
      });

      console.log(`✅ Commande ${orderId} marquée comme payée`);
    } catch (err) {
      // this.handleChargeRefunded(session as unknown as Stripe.Charge);
      console.error(
        "❌ Erreur lors du traitement de checkout.session.completed:",
        err
      );
      // ⚠️ JAMAIS throw après un paiement réussi - gérer manuellement
      await OrderProcessingService.notifyTeamCriticalIssue(session, orderId);
    }
  }
  static async handlePaymentFailed(
    session: Stripe.PaymentIntent | Stripe.Checkout.Session
  ) {
    try {
      // ✅ Vérification stricte du type (utile si tu traites à la fois PaymentIntent et Checkout.Session)
      const isCheckoutSession = "metadata" in session && "id" in session;

      if (!isCheckoutSession) {
        console.error(
          "❌ Session Stripe invalide ou format inattendu:",
          session
        );
        return { error: "Session Stripe invalide" };
      }

      const orderId = session.metadata?.orderId;

      if (!orderId) {
        console.warn("⚠️ Payment failed reçu sans orderId", {
          paymentIntentId: session.id,
        });
        return {
          warning: `⚠️ payment_failed sans orderId`,
          paymentIntentId: session.id,
        };
      }

      // 🔎 Vérifie si la commande existe
      const existingOrder = await prisma.order.findUnique({
        where: { id: orderId },
      });

      if (!existingOrder) {
        console.error(`❌ Aucune commande trouvée avec l'ID ${orderId}`);
        return { error: "Commande introuvable" };
      }

      // 🚫 Vérifie si la commande est déjà marquée comme payée pour éviter les incohérences
      if (existingOrder.paymentStatus === PaymentStatus.PAID) {
        console.warn(
          `⚠️ La commande ${orderId} est déjà payée, pas de mise à jour`
        );
        return { message: "Commande déjà payée" };
      }

      await prisma.order.update({
        where: { id: orderId },
        data: {
          paymentStatus: PaymentStatus.FAILED,
          status: OrderStatus.CANCELLED,
          notes: `Paiement échoué: ${session || "Erreur inconnue"}`,
        },
      });
      console.log(`❌ Commande ${orderId} marquée comme échouée`);
      return { success: true, message: "Commande marquée comme échouée" };
    } catch (error) {
      console.error("❌ Erreur traitement payment_failed:", error);
      return { error: "Erreur interne lors du traitement du paiement échoué" };
    }
  }
  static async handlePaymentIntentSucceeded(session: Stripe.PaymentIntent) {
    try {
      const orderId = session.metadata?.orderId;
      if (orderId) {
        await prisma.order.update({
          where: { id: orderId },
          data: {
            paymentStatus: PaymentStatus.PAID,
            status: OrderStatus.CONFIRMED,
          },
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
      // 🧩 1. Vérifier la présence et validité de l’orderId
      if (!orderId) {
        console.warn("⚠️ Aucun orderId trouvé dans metadata du PaymentIntent");
        return;
      }
      // 🧩 2. Vérifier si la commande existe
      const order = await prisma.order.findUnique({ where: { id: orderId } });
      if (!order) {
        console.warn(`⚠️ Aucune commande trouvée avec l'id ${orderId}`);
        return;
      }

      // 🧩 3. Éviter les doublons (Stripe peut renvoyer le même event)
      if (order.status === OrderStatus.CANCELLED) {
        console.log(`ℹ️ Commande ${orderId} déjà annulée — ignorée`);
        return;
      }

      // 🧩 4. Vérifier le statut Stripe avant d’agir
      if (session.status !== "canceled") {
        console.log(
          `⚠️ PaymentIntent ${session.id} non annulé (status: ${session.status})`
        );
        return;
      }
      // 🧩 5. Mettre à jour proprement la command
      await prisma.order.update({
        where: { id: orderId },
        data: {
          paymentStatus: PaymentStatus.FAILED,
          status: OrderStatus.CANCELLED,
        },
      });
      console.log(`❌ Commande ${orderId} annulée`);
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
          data: {
            paymentStatus: PaymentStatus.DISPUTED,
            status: OrderStatus.PENDING,
          },
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
          data: {
            paymentStatus: PaymentStatus.EXPIRED,
            status: OrderStatus.CANCELLED,
          },
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
        data: { paymentStatus: "REFUNDED", status: OrderStatus.CANCELLED },
      });
      console.log(
        `↩️ Commande avec PaymentIntent ${paymentIntentId} remboursée`
      );
    } catch (err) {
      console.error("Erreur handleChargeRefunded:", err);
    }
  }
  // Notification équipe pour intervention manuelle
  private async notifyTeamCriticalIssue(session: Stripe.Checkout.Session) {
    try {
      // Email d'alerte à l'équipe
      await sendEmail({
        to: process.env.ADMIN_EMAIL || "morocostudent@gmail.com",
        subject: "🚨 INTERVENTION REQUISE - Paiement sans commande",
        htmlFileName: "critical-alert.ejs", // Créer ce template
        context: {
          sessionId: session.id,
          paymentIntentId: session.payment_intent,
          amount: session.amount_total,
          customerEmail: session.customer_details?.email,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      console.error(`❌ Échec notification équipe`, { error });
    }
  }
  private async handleCriticalPaymentWithoutOrder(
    session: Stripe.Checkout.Session
  ) {
    try {
    } catch (error) {
      console.error(`🚨 Impossible de créer commande d'urgence`, {
        error,
        sessionId: session.id,
      });
    }
  }
  private static async sendConfirmationEmailSafely(
    orderId: string,
    email: string,
    customerName: string,
    order: any
  ) {
    try {
      if (!email || !email.includes("@")) {
        console.warn(`⚠️ Email invalide pour commande ${orderId}: ${email}`);
        return;
      }

      const orderData = createOrderData({
        customerEmail: email,
        customerName: customerName || "Client",
        items: order.items.map((item: any) => ({
          title: item.product.title,
          quantity: item.quantity,
          price: item.price,
        })),
      });

      await sendEmail({
        to: email,
        subject: "✅ Confirmation de votre commande",
        htmlFileName: "order-confirmation-email.ejs",
        context: orderData,
      });

      console.log(`📧 Email de confirmation envoyé`, { orderId, email });
    } catch (emailError) {
      console.error(`⚠️ Échec envoi email pour commande ${orderId}`, {
        email,
        error: emailError,
      });

      // Enregistrer l'échec pour retry ultérieur
      // await prisma.order.update({
      //   where: { id: orderId },
      //   data: {
      //     notes: `Échec envoi email: ${emailError instanceof Error ? emailError.message : 'Erreur inconnue'}`
      //   }
      // }).catch(() => {}); // Ignore les erreurs de logging
    }
  }
}
