import { OrderStatus, PrismaClient } from "@prisma/client";
import { handleServerError, timeAgo } from "../utils/helpers";
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
      select: {
        id: true,
        totalAmount: true,
        status: true,
        paymentStatus: true,
        user: {
          select: {  firstName: true, lastName: true, email: true },
        },
        createdAt: true,
      },
    });
    const [orders, lastPage] = await Promise.all([
      prisma.order.findMany(query),
      prisma.order.count({
        where: query.where,
      }),
    ]);
    // const orders = await prisma.order.findMany(query);
    if (!orders.length)
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: "Aucune commande trouvée",
        data: orders,
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

export const getMyOrders = async (req: Request, res: Response) => {
  try {
    const { id } = req.user!;
    const query = QueryBuilderService.buildAdvancedQuery(Model.ORDER, {
      ...(res.locals.validated || {}),
      champPrice: "totalAmount",
      select: {
        id: true,
        totalAmount: true,
        userId: true,
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
        createdAt: true,
      },
      extraWhere: { userId: id },
    });
    const [orders, lastPage] = await Promise.all([
      prisma.order.findMany(query),
      prisma.order.count({
        where: query.where,
      }),
    ]);

    if (!orders)
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: "Commande non trouvée",
        data: orders,
      });
    console.log("Last Page Count:", lastPage);
    res.status(StatusCodes.OK).json({
      success: true,
      data: orders,
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
        status: true,
        paymentStatus: true,
        createdAt: true,
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        items: {
          select: {
            quantity: true,
            product: {
              select: {
                id: true,
                title: true,
              },
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
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: "Commande non trouvée",
      });
    res.status(StatusCodes.OK).json({
      success: true,
      data: order,
    });
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
