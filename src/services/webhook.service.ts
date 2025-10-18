import { OrderProcessingService } from "./order-processing.service";
import { AlertService, alertService } from "./alert.service";
import { InventoryService } from "./inventory.service";
import { sendEmail } from "./emailService.service";
import { createOrderData } from "../utils/object";
import { stripe, Stripe } from "../config/stripe";
import { Model } from "../types/enums";
import prisma from "../config/db";
import {
  AlertSeverity,
  AlertType,
  OrderStatus,
  PaymentStatus,
} from "@prisma/client";

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
  static async handlePaymentRequiresAction(session: Stripe.PaymentIntent) {
    try {
      const orderId = session.metadata?.orderId;
      if (!orderId) {
        console.warn(
          "⚠️ Aucun orderId trouvé dans le metadata du PaymentIntent."
        );
        return;
      }

      // Vérifie que la commande existe avant mise à jour
      const existingOrder = await prisma.order.findUnique({
        where: { id: orderId },
        select: { id: true, paymentStatus: true },
      });

      if (!existingOrder) {
        console.error(
          `❌ Commande introuvable pour le paymentIntent ${session.id}`
        );
        return;
      }

      // Empêche une réécriture inutile si le statut est déjà correct
      if (existingOrder.paymentStatus === PaymentStatus.REQUIRES_ACTION) {
        console.log(
          `ℹ️ Commande ${orderId} déjà marquée comme REQUIRES_ACTION.`
        );
        return;
      }

      await prisma.order.update({
        where: { id: orderId },
        data: {
          paymentStatus: PaymentStatus.REQUIRES_ACTION,
          status: OrderStatus.PENDING,
        },
      });
      console.log(`🔄 Commande ${orderId} nécessite une action`);
    } catch (error) {
      console.error("❌ Erreur traitement payment requires action:", error);
    }
  }
  static async handlePaymentProcessing(session: Stripe.PaymentIntent) {
    const orderId = session.metadata?.orderId;
    if (!orderId) {
      console.warn(
        "⚠️ Aucun orderId trouvé dans le metadata du PaymentIntent."
      );
      return;
    }
    try {
      // Vérifie que la commande existe avant mise à jour
      const existingOrder = await prisma.order.findUnique({
        where: { id: orderId },
        select: { id: true, paymentStatus: true },
      });

      if (!existingOrder) {
        console.error(
          `❌ Commande introuvable pour le paymentIntent ${session.id}`
        );
        return;
      }

      // Empêche une réécriture inutile si le statut est déjà correct
      if (existingOrder.paymentStatus === PaymentStatus.PROCESSING) {
        console.log(`ℹ️ Commande ${orderId} déjà marquée comme PROCESSING.`);
        return;
      }
      // Mise à jour du statut
      await prisma.order.update({
        where: { id: orderId },
        data: { paymentStatus: "PROCESSING", status: "PENDING" },
      });
      console.log(`⌛ [Stripe] Commande ${orderId} en cours de traitement.`);
    } catch (err) {
      console.error("❌ Erreur traitement payment requires action:", err);
    }
  }
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
  static async handleSessionExpired(session: Stripe.Checkout.Session) {
    const orderId = session.metadata?.orderId;
    if (!orderId) {
      console.warn("⚠️ Session expirée sans orderId dans metadata");
      return;
    }
    try {
      await prisma.$transaction(async (tx) => {
        // 1️⃣ Vérifie si la commande existe
        const order = await tx.order.findUnique({ where: { id: orderId } });

        if (!order) {
          console.warn(
            `⚠️ Commande ${orderId} introuvable lors de l'expiration`
          );
          return;
        }

        // 2️⃣ Vérifie si elle n’a pas déjà un état final
        const finalStatuses: PaymentStatus[] = [
          PaymentStatus.PAID,
          PaymentStatus.REFUNDED,
          PaymentStatus.FAILED,
        ];

        if (finalStatuses.includes(order.paymentStatus)) {
          console.log(
            `ℹ️ Commande ${orderId} déjà traitée (${order.paymentStatus}), ignorée.`
          );
          return;
        }

        // 3️⃣ Met à jour la commande
        await tx.order.update({
          where: { id: orderId },
          data: {
            paymentStatus: PaymentStatus.EXPIRED,
            status: OrderStatus.CANCELLED,
            notes: `Session Stripe expirée automatiquement à ${new Date().toISOString()}`,
          },
        });
      });

      console.log(`⏰ Commande ${orderId} expirée`);
    } catch (error) {
      console.error("❌ Erreur traitement session expired:", error);
    }
  }
  static async handleDisputeCreated(session: Stripe.Dispute) {
    const orderId = session.metadata?.orderId;

    if (!orderId) {
      console.warn(`⚠️ Aucun orderId trouvé pour le chargeId ${session.id}`);
      return;
    }
    try {
      // Met à jour le statut pour refléter le litige
      const updated = await prisma.order.updateMany({
        where: { id: orderId, paymentStatus: { not: PaymentStatus.DISPUTED } },
        data: {
          paymentStatus: PaymentStatus.DISPUTED,
          status: OrderStatus.ON_HOLD, // ou “ON_HOLD_FOR_DISPUTE”
        },
      });
      if (updated.count > 0) {
        console.log(
          `⚠️ Commande ${orderId} en litige (chargeback). Prévenir le support.`
        );
        alertService.create({
          type: AlertType.DISPUTE_CREATED,
          severity: AlertSeverity.URGENT,
          message: `Litige créé pour la commande ${orderId}. Prévenir le support et collecter preuves.`,
          entityType: Model.ORDER,
          entityId: orderId,
        });
      } else {
        console.log(`ℹ️ Commande ${orderId} déjà marquée comme DISPUTED.`);
      }
    } catch (error) {
      console.error("❌ Erreur traitement dispute created:", error);
      alertService.create({
        type: AlertType.DISPUTE_CREATED,
        severity: AlertSeverity.URGENT,
        message: `Erreur traitement litige pour la commande ${orderId}: ${error}`,
        entityType: Model.ORDER,
        entityId: orderId,
      });
    }
  }
  /**
   * 🔄 Met à jour le statut d'un litige en cours.
   * Utilisé pour refléter l’évolution d’un litige Stripe côté back-office.
   */
  static async handleDisputeUpdated(session: Stripe.Dispute) {
    const orderId = session.metadata?.orderId;
    if (!orderId) {
      console.warn(`⚠️ Aucun orderId trouvé pour le chargeId ${session.id}`);
      return;
    }
    try {
      const updated = await prisma.order.updateMany({
        where: { id: orderId },
        data: {
          paymentStatus: session.status as PaymentStatus,
          updatedAt: new Date(),
        },
      });
      if (updated.count > 0) {
        console.log(`🟡 Litige ${session.id} mis à jour (${session.status}).`);
        // Crée une alerte pour suivi interne si le statut devient critique
        if (
          session.status === "needs_response" ||
          session.status === "under_review"
        ) {
          await alertService.create({
            type: AlertType.DISPUTE_UPDATED,
            severity: AlertSeverity.CRITICAL,
            message: `Litige ${session.id} pour la commande ${orderId} a changé de statut: ${session.status}`,
            entityType: Model.ORDER,
            entityId: orderId,
          });
        }
      } else {
        console.log(
          `ℹ️ Aucun changement pour le litige ${session.id} (déjà à jour).`
        );
      }

      console.log(`🟡 Litige ${session.id} mis à jour (${session.status}).`);
    } catch (err) {
      console.log("❌ Erreur traitement dispute updated:", err);
      alertService.create({
        type: AlertType.DISPUTE_UPDATED,
        severity: AlertSeverity.CRITICAL,
        message: `Erreur traitement litige ${session.id} pour la commande ${orderId}: ${err}`,
        entityType: Model.ORDER,
        entityId: orderId,
      });
    }
  }

  /**
   * 🏁 Gère la clôture d’un litige Stripe.
   * Met à jour la commande selon le verdict (gagné ou perdu).
   */
  static async handleDisputeClosed(session: Stripe.Dispute) {
    const orderId = session.metadata?.orderId;

    if (!orderId) {
      console.warn(
        "⚠️ handleDisputeClosed: orderId manquant dans les métadonnées Stripe."
      );
      return;
    }
    const isWon = session.status === "won";
    const newPaymentStatus = isWon
      ? PaymentStatus.PAID
      : PaymentStatus.REFUNDED;
    const newOrderStatus = isWon ? OrderStatus.RESOLVED : OrderStatus.CANCELLED;
    try {
    } catch (err) {
      console.log("❌ Erreur traitement dispute closed:", err);
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
}
