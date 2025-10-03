import { Request, Response, NextFunction } from "express";
import { stripe, webhookSecret } from "../config/stripe";
export const verifyStripeWebhook = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const signature = req.headers["stripe-signature"] as string;
  if (!signature) {
    return res.status(400).json({ error: "Signature manquante" });
  }

  try {
    const event = stripe.webhooks.constructEvent(
      req.body,
      signature,
      webhookSecret!
    );
    req.stripeEvent = event;
    next();
  } catch (err) {
    console.error("❌ Erreur vérification webhook:", err);
    return res.status(400).json({ error: "Signature webhook invalide" });
  }
};
