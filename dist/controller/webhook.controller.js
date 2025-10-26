"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.stripeWebhook = void 0;
const payment_service_1 = require("../services/payment.service");
const http_status_codes_1 = require("http-status-codes");
const stripeWebhook = async (req, res) => {
    try {
        const event = req.stripeEvent;
        console.log(`📩 Webhook reçu: ${event?.type}`, {
            eventId: event?.id,
            type: event?.type,
        });
        await (0, payment_service_1.handleStripeWebhook)(event);
        res.status(http_status_codes_1.StatusCodes.OK).json({
            received: true,
            event: event?.type,
        });
    }
    catch (err) {
        console.error("💥 Erreur contrôleur webhook:", err);
        res.status(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR).json({
            error: "Erreur traitement webhook",
        });
    }
};
exports.stripeWebhook = stripeWebhook;
//# sourceMappingURL=webhook.controller.js.map