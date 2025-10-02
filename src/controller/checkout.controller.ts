import { createStripeSession } from "../services/payment.service";
import { OrderWithRelations } from "../types/order.type";
import { createOrder } from "../services/order.service";
import { handleServerError } from "../utils/helpers";
import { StatusCodes } from "http-status-codes";
import { Request, Response } from "express";

export const createCheckoutSession = async (req: Request, res: Response) => {
  try {
    const { userId, items } = req.body;
    const order: OrderWithRelations = await createOrder(userId, items);
    const id = await createStripeSession(order);
    res
      .status(StatusCodes.OK)
      .json({ success: true, message: "Commande créée avec succès", id });
  } catch (err) {
    handleServerError(res, err);
  }
};
