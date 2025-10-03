import { Request, Response } from "express";
import { handleStripeWebhook } from "../services/payment.service";
import { StatusCodes } from "http-status-codes";

export const stripeWebhook = async (req: Request, res: Response) => {
  try {
    const event = req.stripeEvent;
    console.log(`📩 Webhook reçu: ${event?.type}`, {
      eventId: event?.id,
      type: event?.type,
    });
    await handleStripeWebhook(event!);
    res.status(StatusCodes.OK).json({
      received: true,
      event: event?.type,
    });
  } catch (err) {
    console.error("💥 Erreur contrôleur webhook:", err);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      error: "Erreur traitement webhook",
    });
  }
};
