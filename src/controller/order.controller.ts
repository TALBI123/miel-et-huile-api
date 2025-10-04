import { handleServerError } from "../utils/helpers";
import { StatusCodes } from "http-status-codes";
import { PrismaClient } from "@prisma/client";
import { Request, Response } from "express";
const prisma = new PrismaClient();
export const getOrders = async (req: Request, res: Response) => {
  try {
    const orders = await prisma.order.findMany();
    if (!orders.length)
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: "Aucune commande trouvée",
      });

    res.status(StatusCodes.OK).json({
      success: true,
      data: orders,
    });
  } catch (err) {
    handleServerError(res, err);
  }
};
export const getOrderById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const order = await prisma.order.findUnique({
      where: { id },
    });
    if (!order)
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ success: false, message: "Commande non trouvée" });
    res.status(StatusCodes.OK).json({ success: true, data: order });
  } catch (err) {
    handleServerError(res, err);
  }
};
export const updateOrder = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const order = await prisma.order.update({
      where: { id },
      data: { status },
    });
    res.json(order);
  } catch (err) {
    handleServerError(res, err);
  }
}
export const cancelOrder = async (req: Request, res: Response) => {
  const { id } = req.params;
  const order = await prisma.order.update({
    where: { id },
    data: { status: "CANCELLED" },
  });
  res.json(order);
};
