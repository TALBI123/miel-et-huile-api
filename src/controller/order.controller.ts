import { OrderStatus, PrismaClient } from "@prisma/client";
import { handleServerError, timeAgo } from "../utils/helpers";
import { buildProductQuery } from "../utils/filter";
import { StatusCodes } from "http-status-codes";
import { Request, Response } from "express";
import { Model } from "../data/allowedNames";
import { QueryBuilderService } from "../services/queryBuilder.service";
const prisma = new PrismaClient();
export const getOrders = async (req: Request, res: Response) => {
  try {
    const query = QueryBuilderService.buildAdvancedQuery(Model.ORDER, {
      ...(res.locals.validated || {}),
      champPrice: "totalAmount",
    });
    console.log(query);
    const orders = await prisma.order.findMany(query);
    if (!orders.length)
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: "Aucune commande trouvée",
      });
    const lastPage = await prisma.order.count({
      where: query.where,
    });
    console.log(
      " ",
      orders.map((order) => timeAgo(order.createdAt.toISOString()))
    );
    res.status(StatusCodes.OK).json({
      success: true,
      data: orders.map((order) => ({
        ...order,
        timeAgo: timeAgo(order.createdAt.toISOString()),
      })),
      total: lastPage,
      len: orders.length,
      lastPage: Math.ceil(lastPage / (res.locals.validated.limit || 5)),
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
      select: {
        id: true,
        totalAmount: true,
        createdAt: true,
        status: true,
        paymentStatus: true,
        user: { select: { firstName: true, lastName: true, email: true } },
        items: {
          include: {
            product: {
              select: { title: true, subDescription: true },
            },
            variant: {
              select: {
                amount: true,
                unit: true,
                price: true,
                discountPrice: true,
                isOnSale: true,
              },
            },
          },
        },
      },
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
