import { PrismaClient } from "@prisma/client";
// import { stripe } from "../config/stripe";

const prisma = new PrismaClient();

export class WebhookService {
  private static async updateStockAndConfirmOrder(orderId: string) {
    try{
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: { items: { include: { variant: true } } },
      });
      if(!order)
        throw new Error(`Order with ID ${orderId} not found`);
      
      console.log("✅ Stock mis à jour et commande confirmée");
    }catch(err){
      console.error("❌ Erreur mise à jour stock/confirmation commande:", err);
    }
  }
  static async handleCheckoutSessionCompleted(session: any) {
    try {
      const orderId = session.metadata.orderId;
      console.log(" ------ Session Metadata:", session.metadata);
      if (!orderId) {
        console.error("❌ No orderId found in session metadata");
        return;
      }
      await prisma.order.update({
        where: { id: orderId },
        data: {
          paymentStatus: "PAID",
          status: "CONFIRMED",
          paymentMethod: session.payment_method_types?.[0] || "card",
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
  static async handlePaymentFailed(session: any) {
    try {
      const orderId = session.metadata.orderId;
      if (orderId) {
        await prisma.order.update({
          where: { id: orderId },
          data: { paymentStatus: "FAILED", status: "CANCELLED" },
        });
      }
      console.log(`❌ Commande ${orderId} marquée comme échouée`);
    } catch (error) {
      console.error("❌ Erreur traitement payment failed:", error);
    }
  }
}
