import { ProductValidationService } from "../services/product-validation.service";
import { OrderProcessingService } from "../services/order-processing.service";
import { createStripeSession } from "../services/payment.service";
import { OrderWithRelations } from "../types/order.type";
import { handleServerError } from "../utils/helpers";
import { StatusCodes } from "http-status-codes";
import { Request, Response } from "express";

export const createCheckoutSession = async (req: Request, res: Response) => {
  try {
    const { items, shippingCost } = req.body;
    // console.log(req.user);
    // console.log("Items received in createCheckoutSession:", items);
    const validationResponse = await ProductValidationService.validateItems(
      items
    );
    // console.log("Validation response:", validationResponse);
    if (!validationResponse.success)
      return res.status(StatusCodes.BAD_REQUEST).json(validationResponse);
    console.log("🛒 Articles validés avec succès.");
    console.log("🛒 Création de la commande en cours...");
    const order: OrderWithRelations = await OrderProcessingService.createOrder(
      req.user?.id!,
      items,
      shippingCost,
    );
    const clientSecret = await createStripeSession(
      order,
      shippingCost,
      req.user?.email!
    );
    res.status(StatusCodes.OK).json({
      success: true,
      message: "Commande créée avec succès",
      ...clientSecret,
    });
  } catch (err) {
    handleServerError(res, err);
  }
};
