import { OrderStatus, PrismaClient } from "@prisma/client";
import { Stripe } from "../config/stripe";
import { sendEmail } from "./emailService.service";
import { createOrderData } from "../utils/object";

const prisma = new PrismaClient();

export class OrderProcessingService {

  
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
                  Customer: ${session.customer_details?.email || 'N/A'}
                  Amount: ${session.amount_total}
                  PaymentIntent: ${session.payment_intent}
                  Timestamp: ${new Date().toISOString()}`,
          // Pas d'items pour les commandes d'urgence - géré manuellement
        }
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
      include: {
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
}
