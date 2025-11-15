// import { stripeWebhook } from "../controllers/webhook.controller";
// import { verifyStripeWebhook } from "../middleware/webhookAuth";
import { verifyStripeWebhook } from "../middlewares/webhookAuth";
import { stripeWebhook } from "../controller/webhook.controller";
import express, { Request, Response } from "express";

const router = express.Router();

router.post(
  "/stripe",
  express.raw({ type: "application/json" }),
  verifyStripeWebhook,
  stripeWebhook
);

// Route de santé
router.get("/health", (req: Request, res: Response) => {
  res.json({
    status: "active",
    service: "stripe-webhook",
    timestamp: new Date().toISOString(),
  });
});

export default router;
