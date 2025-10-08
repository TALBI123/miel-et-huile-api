import { OrderStatus, PrismaClient } from "@prisma/client";
import { handleServerError } from "../utils/helpers";
import { buildProductQuery } from "../utils/filter";
import { StatusCodes } from "http-status-codes";
import { Request, Response } from "express";
import { EnumTables } from "../data/allowedNames";
const prisma = new PrismaClient();
export const getOrders = async (req: Request, res: Response) => {
  try {
    console.log(res.locals.validated)
    const query = buildProductQuery({
      ...(res.locals.validated || {}),
      relationName: EnumTables.ORDER,
    });
    console.log(query);
    const orders = await prisma.order.findMany(query);
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
};
export const cancelOrder = async (req: Request, res: Response) => {
  const { id } = req.params;
  const order = await prisma.order.update({
    where: { id },
    data: { status: OrderStatus.CANCELLED },
  });
  res.json(order);
};
