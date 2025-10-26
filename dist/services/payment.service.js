"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleStripeWebhook = exports.createStripeSession = void 0;
const webhook_service_1 = require("./webhook.service");
const stripe_1 = require("../config/stripe");
const db_1 = __importDefault(require("../config/db"));
const createStripeSession = async (order, shippingCost, email) => {
    const line_items = order.items.map((item) => ({
        price_data: {
            currency: "eur",
            product_data: {
                name: item.product?.title,
                description: item.product?.subDescription ?? "",
                images: item.product?.images?.map((img) => img.image) || [],
            },
            unit_amount: Math.round((item.variant?.isOnSale
                ? item.variant?.discountPrice
                : item.variant?.price) * 100), // en cents
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
    console.log(`🛒 Création session Stripe pour la commande ID: ${order.id}`);
    // const paymentIntent = await stripe.paymentIntents.create({
    //   amount: Math.round(
    //     (order.items.reduce((acc, item) => {
    //       const itemPrice = item.variant?.isOnSale
    //         ? item.variant?.discountPrice!
    //         : item.variant?.price!;
    //       return acc + itemPrice * item.quantity;
    //     }, 0) +
    //       shippingCost) *
    //       100
    //   ),
    //   currency: "eur",
    //   metadata: {
    //     orderId: order.id,
    //     email,
    //     customerName: `${order.user?.firstName} ${order.user?.lastName}`,
    //   },
    // });
    const sessionParams = {
        payment_method_types: ["card"],
        line_items,
        mode: "payment",
        metadata: {
            orderId: order.id,
            email,
            customerName: `${order.user?.firstName} ${order.user?.lastName}`,
        },
        payment_intent_data: {
            metadata: {
                orderId: order.id,
                email,
                customerName: `${order.user?.firstName} ${order.user?.lastName}`,
            },
        },
    };
    console.log("✅ sessionParams:", sessionParams);
    if (!isModeDev) {
        sessionParams.ui_mode = "embedded";
        sessionParams.return_url = `${process.env.FRONTEND_PROD_URL}/shipping?session_id={CHECKOUT_SESSION_ID}`;
    }
    else {
        sessionParams.success_url = `${process.env.FRONTEND_PROD_URL}/success?session_id={CHECKOUT_SESSION_ID}`;
        sessionParams.cancel_url = `${process.env.FRONTEND_PROD_URL}/cancel`;
    }
    // const session = await stripe.checkout.sessions.create(sessionParams);
    const successUrl = isModeDev
        ? `${process.env.FRONTEND_PROD_URL}/success?session_id={CHECKOUT_SESSION_ID}`
        : `${process.env.FRONTEND_PROD_URL}/shipping?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${process.env.FRONTEND_PROD_URL}/cancel`;
    // 💳 Créer la session Checkout (Stripe crée automatiquement le PaymentIntent)
    const session = await stripe_1.stripe.checkout.sessions.create(sessionParams);
    // const session = await stripe.checkout.sessions.create({
    //   payment_method_types: ["card"],
    //   line_items,
    //   mode: "payment",
    //   success_url: successUrl,
    //   cancel_url: cancelUrl,
    //   metadata: {
    //     orderId: order.id,
    //     email,
    //     customerName: `${order.user?.firstName} ${order.user?.lastName}`,
    //   },
    //   payment_intent_data: {
    //     metadata: {
    //       orderId: order.id,
    //       email,
    //       customerName: `${order.user?.firstName} ${order.user?.lastName}`,
    //     },
    //   },
    // });
    // ✅ Enregistrer le PaymentIntent ID créé par Stripe
    await db_1.default.order.update({
        where: { id: order.id },
        data: { stripePaymentIntentId: session.payment_intent },
    });
    console.log("✅ Session créée avec succès :", {
        sessionId: session.id,
        paymentIntentId: session.payment_intent,
        orderId: order.id,
    });
    return { clientSecret: session.client_secret, id: session.id };
};
exports.createStripeSession = createStripeSession;
const handleStripeWebhook = async (event) => {
    try {
        switch (event.type) {
            // Événements de paiement réussis
            case "checkout.session.completed":
            case "checkout.session.async_payment_succeeded":
                console.log("Event :    ✅ Paiement réussi reçu via webhook Stripe.");
                await webhook_service_1.WebhookService.handleCheckoutSessionCompleted(event.data.object);
                break;
            // Événements d'échec de paiement
            case "payment_intent.payment_failed":
            case "checkout.session.async_payment_failed":
                console.log("Event :    ❌ Échec du paiement reçu via webhook Stripe.");
                await webhook_service_1.WebhookService.handlePaymentFailed(event.data.object);
                break;
            // Événements de litige
            case "charge.dispute.created":
                console.log("Event :    ⚠️ Litige créé reçu via webhook Stripe.");
                await webhook_service_1.WebhookService.handleDisputeCreated(event.data.object);
                break;
            case "charge.dispute.updated":
                console.log("Event :    ⚠️ Litige mis à jour reçu via webhook Stripe.");
                await webhook_service_1.WebhookService.handleDisputeUpdated(event.data.object);
                break;
            case "charge.dispute.closed":
                console.log("Event :    ⚠️ Litige fermé reçu via webhook Stripe.");
                await webhook_service_1.WebhookService.handleDisputeClosed(event.data.object);
                break;
            // NOUVEAUX ÉVÉNEMENTS CRITIQUES POUR LA PRODUCTION
            // case "payment_intent.succeeded":
            //   await WebhookService.handlePaymentIntentSucceeded(
            //     event.data.object as Stripe.PaymentIntent
            //   );
            //   break;
            case "payment_intent.requires_action":
                console.log("Event :    🔄 Action requise pour le paiement via webhook Stripe.");
                await webhook_service_1.WebhookService.handlePaymentRequiresAction(event.data.object);
                break;
            case "payment_intent.processing":
                console.log("Event :    ⏳ Paiement en cours via webhook Stripe.");
                await webhook_service_1.WebhookService.handlePaymentProcessing(event.data.object);
                break;
            case "payment_intent.canceled":
                console.log("Event :    ❌ Paiement annulé reçu via webhook Stripe.");
                await webhook_service_1.WebhookService.handlePaymentCanceled(event.data.object);
                break;
            // Événements de session expirée
            case "checkout.session.expired":
                console.log("Event :    ⏰ Session expirée reçue via webhook Stripe.");
                await webhook_service_1.WebhookService.handleSessionExpired(event.data.object);
                break;
            // Événements de remboursement
            case "charge.refunded":
                await webhook_service_1.WebhookService.handleChargeRefunded(event.data.object);
                break;
            default:
                console.log(`ℹ️ Événement non géré: ${event.type}`);
        }
    }
    catch (err) {
        console.error("❌ Erreur traitement webhook Stripe:", err);
        throw err;
    }
};
exports.handleStripeWebhook = handleStripeWebhook;
//# sourceMappingURL=payment.service.js.map