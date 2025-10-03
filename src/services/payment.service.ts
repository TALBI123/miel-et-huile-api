import { OrderWithRelations } from "../types/order.type";
import { WebhookService } from "./webhook.service";
import { stripe } from "../config/stripe";
import Stripe from "stripe";
export const createStripeSession = async (order: OrderWithRelations) => {
  const line_items = order.items.map((item) => ({
    price_data: {
      currency: "eur",
      product_data: {
        name: item.product?.title!,
        description: item.product?.subDescription ?? "",
        images: item.product?.images?.map((img) => img.image) || [],
      },
      unit_amount: Math.round(
        (item.variant?.isOnSale
          ? item.variant?.discountPrice!
          : item.variant?.price!) * 100
      ), // en cents
    },
    quantity: item.quantity,
  }));
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    line_items,
    mode: "payment",
    success_url: `${process.env.FRONTEND_URL}/success`,
    cancel_url: `${process.env.FRONTEND_URL}/cancel`,
    metadata: {
      orderId: order.id,
    },
  });
  return session.id;
};
export const handleStripeWebhook = async (event: Stripe.Event) => {
  try {
    switch (event.type) {
      case "checkout.session.completed":
        const session = event.data.object as Stripe.Checkout.Session;
        console.log("📋 Métadonnées de la session:", session.metadata);
        console.log("🔍 Session complète:", JSON.stringify(session, null, 2));
        await WebhookService.handleCheckoutSessionCompleted(event.data.object);
        break;

      case "checkout.session.async_payment_succeeded":
        await WebhookService.handleCheckoutSessionCompleted(event.data.object);
        break;

      case "checkout.session.async_payment_failed":
        await WebhookService.handlePaymentFailed(event.data.object);
        break;

      case "payment_intent.payment_failed":
        console.log("❌ Paiement échoué:", event.data.object);
        break;

      default:
        console.log(`ℹ️ Événement non géré: ${event.type}`);
    }
  } catch (err) {
    console.error("❌ Erreur traitement webhook Stripe:", err);
    throw err;
  }
};
