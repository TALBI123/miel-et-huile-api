"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// import { stripeWebhook } from "../controllers/webhook.controller";
// import { verifyStripeWebhook } from "../middleware/webhookAuth";
const webhookAuth_1 = require("../middlewares/webhookAuth");
const webhook_controller_1 = require("../controller/webhook.controller");
const express_1 = __importDefault(require("express"));
const router = express_1.default.Router();
router.post("/stripe", express_1.default.raw({ type: "application/json" }), webhookAuth_1.verifyStripeWebhook, webhook_controller_1.stripeWebhook);
// Route de santé
router.get("/health", (req, res) => {
    res.json({
        status: "active",
        service: "stripe-webhook",
        timestamp: new Date().toISOString(),
    });
});
exports.default = router;
//# sourceMappingURL=webhook.routes.js.map