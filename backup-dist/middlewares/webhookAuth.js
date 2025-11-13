"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyStripeWebhook = void 0;
const stripe_1 = require("../config/stripe");
const verifyStripeWebhook = (req, res, next) => {
    const signature = req.headers["stripe-signature"];
    if (!signature) {
        return res.status(400).json({ error: "Signature manquante" });
    }
    console.log("🔐 Vérification webhook Stripe en cours...");
    try {
        const event = stripe_1.stripe.webhooks.constructEvent(req.body, signature, stripe_1.webhookSecret);
        req.stripeEvent = event;
        next();
    }
    catch (err) {
        console.error("❌ Erreur vérification webhook:", err);
        return res.status(400).json({ error: "Signature webhook invalide" });
    }
};
exports.verifyStripeWebhook = verifyStripeWebhook;
//# sourceMappingURL=webhookAuth.js.map