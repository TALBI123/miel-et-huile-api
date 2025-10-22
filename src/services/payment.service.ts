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
  const isModeDev = process.env.NODE_ENV === "development";
  // console.log(line_items, shippingCost);
  console.log(`🛒 Création session Stripe pour la commande ID: ${order.id}`);
  const sessionParams: any = {
    payment_method_types: ["card"],
    line_items,
    mode: "payment",
    metadata: {
      orderId: order.id,
      email,
      customerName: `${order.user?.firstName} ${order.user?.lastName}`,
    },
  };
  console.log("✅ sessionParams:", sessionParams);
  if (!isModeDev) {
    sessionParams.ui_mode = "embedded";
    sessionParams.return_url = `${process.env.FRONTEND_PROD_URL}/shipping?session_id={CHECKOUT_SESSION_ID}`;
  } else {
    sessionParams.success_url = `${process.env.FRONTEND_PROD_URL}/success?session_id={CHECKOUT_SESSION_ID}`;
    sessionParams.cancel_url = `${process.env.FRONTEND_PROD_URL}/cancel`;
  }

  const session = await stripe.checkout.sessions.create(sessionParams);
  return { clientSecret: session.client_secret, id: session.id };
};
export const handleStripeWebhook = async (event: Stripe.Event) => {
  try {
    switch (event.type) {
      // Événements de paiement réussis
      case "checkout.session.completed":
      case "checkout.session.async_payment_succeeded":
        console.log("Event :    ✅ Paiement réussi reçu via webhook Stripe.");
        await WebhookService.handleCheckoutSessionCompleted(
          event.data.object as Stripe.Checkout.Session
        );
        break;
      // Événements d'échec de paiement
      case "checkout.session.async_payment_failed":
      case "payment_intent.payment_failed":
        console.log("Event :    ❌ Échec du paiement reçu via webhook Stripe.");

        await WebhookService.handlePaymentFailed(
          event.data.object as Stripe.PaymentIntent | Stripe.Checkout.Session
        );
        break;

      // Événements de litige
      case "charge.dispute.created":
        console.log("Event :    ⚠️ Litige créé reçu via webhook Stripe.");
        await WebhookService.handleDisputeCreated(
          event.data.object as Stripe.Dispute
        );
        break;
      case "charge.dispute.updated":
        console.log("Event :    ⚠️ Litige mis à jour reçu via webhook Stripe.");

        await WebhookService.handleDisputeUpdated(
          event.data.object as Stripe.Dispute
        );
        break;

      case "charge.dispute.closed":
        console.log("Event :    ⚠️ Litige fermé reçu via webhook Stripe.");

        await WebhookService.handleDisputeClosed(
          event.data.object as Stripe.Dispute
        );
        break;

      // NOUVEAUX ÉVÉNEMENTS CRITIQUES POUR LA PRODUCTION
      // case "payment_intent.succeeded":
      //   await WebhookService.handlePaymentIntentSucceeded(
      //     event.data.object as Stripe.PaymentIntent
      //   );
      //   break;

      case "payment_intent.requires_action":
        console.log(
          "Event :    🔄 Action requise pour le paiement via webhook Stripe."
        );

        await WebhookService.handlePaymentRequiresAction(
          event.data.object as Stripe.PaymentIntent
        );
        break;
      case "payment_intent.processing":
        console.log("Event :    ⏳ Paiement en cours via webhook Stripe.");

        await WebhookService.handlePaymentProcessing(event.data.object);
        break;

      case "payment_intent.canceled":
        console.log("Event :    ❌ Paiement annulé reçu via webhook Stripe.");

        await WebhookService.handlePaymentCanceled(
          event.data.object as Stripe.PaymentIntent
        );
        break;

      // Événements de session expirée
      case "checkout.session.expired":
        console.log("Event :    ⏰ Session expirée reçue via webhook Stripe.");

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
