import { OrderWithRelations } from "../types/order.type";
import { WebhookService } from "./webhook.service";
import { stripe } from "../config/stripe";
import Stripe from "stripe";
export const createStripeSession = async (
  order: OrderWithRelations,
  shippingCost: number,
  email: string
) => {
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
  line_items.push({
    price_data: {
      currency: "eur",
      product_data: {
        name: "Frais de livraison ",
        description: "Frais de livraison pour votre commande",
        images: [],
      },
      unit_amount: Math.round(shippingCost * 100), // en cents
    },
    quantity: 1,
  });
  // console.log(line_items, shippingCost);
  const session = await stripe.checkout.sessions.create({
    ui_mode:'embedded',
    payment_method_types: ["card"],
    line_items,
    mode: "payment",
    return_url: `${process.env.FRONTEND_URL}/order-confirmation?session_id={CHECKOUT_SESSION_ID}`,
    success_url: `${process.env.FRONTEND_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.FRONTEND_URL}/cancel`,
    metadata: {
      orderId: order.id,
      email,
      customerName: `${order.user?.firstName} ${order.user?.lastName}`,
    },
  });
  return {clientSecret : session.client_secret,id : session.id};
};
export const handleStripeWebhook = async (event: Stripe.Event) => {
  try {
    switch (event.type) {
      // Événements de paiement réussis
      case "checkout.session.completed":
      case "checkout.session.async_payment_succeeded":
        await WebhookService.handleCheckoutSessionCompleted(
          event.data.object as Stripe.Checkout.Session
        );
        break;

      // Événements d'échec de paiement
      case "checkout.session.async_payment_failed":
      case "payment_intent.payment_failed":
        await WebhookService.handlePaymentFailed(
          event.data.object as Stripe.PaymentIntent | Stripe.Checkout.Session
        );
        break;

      // NOUVEAUX ÉVÉNEMENTS CRITIQUES POUR LA PRODUCTION
      case "payment_intent.succeeded":
        await WebhookService.handlePaymentIntentSucceeded(
          event.data.object as Stripe.PaymentIntent
        );
        break;

      // case "payment_intent.requires_action":
      //   await WebhookService.handlePaymentRequiresAction(event.data.object  as Stripe.PaymentIntent);
      //   break;

      case "payment_intent.canceled":
        await WebhookService.handlePaymentCanceled(
          event.data.object as Stripe.PaymentIntent
        );
        break;

      // Événements de remboursement
      case "charge.dispute.created":
        await WebhookService.handleDisputeCreated(
          event.data.object as Stripe.Dispute
        );
        break;

      // case "invoice.payment_failed":
      //   await WebhookService.handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
      //   break;
      // Événements de session expirée
      case "checkout.session.expired":
        await WebhookService.handleSessionExpired(
          event.data.object as Stripe.Checkout.Session
        );
        break;

      // Événements de remboursement
      case "charge.refunded":
        await WebhookService.handleChargeRefunded(
          event.data.object as Stripe.Charge
        );
        break;

      default:
        console.log(`ℹ️ Événement non géré: ${event.type}`);
    }
  } catch (err) {
    console.error("❌ Erreur traitement webhook Stripe:", err);
    throw err;
  }
};
