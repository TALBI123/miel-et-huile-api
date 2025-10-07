import { createStripeSession } from "../services/payment.service";
import { OrderWithRelations } from "../types/order.type";
import { createOrder } from "../services/order.service";
import { handleServerError } from "../utils/helpers";
import { StatusCodes } from "http-status-codes";
import { Request, Response } from "express";

export const createCheckoutSession = async (req: Request, res: Response) => {
  try {
    const {  items, shippingCost } = req.body;
    console.log(req.user)
    console.log("Items received in createCheckoutSession:", items);
    const order: OrderWithRelations = await createOrder(req.user?.id!, items);
    const clientSecret = await createStripeSession(order, shippingCost, req.user?.email!);
    res
      .status(StatusCodes.OK)
      .json({ success: true, message: "Commande créée avec succès", clientSecret });
  } catch (err) {
    handleServerError(res, err);
  }
};
