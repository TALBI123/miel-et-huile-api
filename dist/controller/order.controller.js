"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cancelOrder = exports.updateOrder = exports.getOrderById = exports.getMyOrders = exports.getOrders = void 0;
const client_1 = require("@prisma/client");
const helpers_1 = require("../utils/helpers");
const http_status_codes_1 = require("http-status-codes");
const enums_1 = require("../types/enums");
const queryBuilder_service_1 = require("../services/queryBuilder.service");
const prisma = new client_1.PrismaClient();
const getOrders = async (req, res) => {
    try {
        const query = queryBuilder_service_1.QueryBuilderService.buildAdvancedQuery(enums_1.Model.ORDER, {
            ...(res.locals.validated || {}),
            champPrice: "totalAmount",
            select: {
                id: true,
                totalAmount: true,
                status: true,
                paymentStatus: true,
                user: {
                    select: { firstName: true, lastName: true, email: true },
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
            return res.status(http_status_codes_1.StatusCodes.NOT_FOUND).json({
                success: false,
                message: "Aucune commande trouvée",
                data: orders,
            });
        // console.log(
        //   " ",
        //   orders.map((order) => timeAgo(order.createdAt.toISOString()))
        // );
        res.status(http_status_codes_1.StatusCodes.OK).json({
            success: true,
            data: orders.map((order) => ({
                ...order,
                timeAgo: (0, helpers_1.timeAgo)(order.createdAt.toISOString()),
            })),
            total: lastPage,
            len: orders.length,
            lastPage: Math.ceil(lastPage / (res.locals.validated.limit || 5)),
        });
    }
    catch (err) {
        (0, helpers_1.handleServerError)(res, err);
    }
};
exports.getOrders = getOrders;
const getMyOrders = async (req, res) => {
    try {
        const { id } = req.user;
        // console.log(req.user)
        const query = queryBuilder_service_1.QueryBuilderService.buildAdvancedQuery(enums_1.Model.ORDER, {
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
            return res.status(http_status_codes_1.StatusCodes.NOT_FOUND).json({
                success: false,
                message: "Commande non trouvée",
                data: orders,
            });
        // console.log("Last Page Count:", lastPage);
        res.status(http_status_codes_1.StatusCodes.OK).json({
            success: true,
            data: orders,
            total: lastPage,
            len: orders.length,
            lastPage: Math.ceil(lastPage / (res.locals.validated.limit || 5)),
        });
    }
    catch (err) {
        (0, helpers_1.handleServerError)(res, err);
    }
};
exports.getMyOrders = getMyOrders;
const getOrderById = async (req, res) => {
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
            return res.status(http_status_codes_1.StatusCodes.NOT_FOUND).json({
                success: false,
                message: "Commande non trouvée",
            });
        res.status(http_status_codes_1.StatusCodes.OK).json({
            success: true,
            data: order,
        });
    }
    catch (err) {
        (0, helpers_1.handleServerError)(res, err);
    }
};
exports.getOrderById = getOrderById;
const updateOrder = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const order = await prisma.order.update({
            where: { id },
            data: { status },
        });
        res.json(order);
    }
    catch (err) {
        (0, helpers_1.handleServerError)(res, err);
    }
};
exports.updateOrder = updateOrder;
const cancelOrder = async (req, res) => {
    const { id } = req.params;
    const order = await prisma.order.update({
        where: { id },
        data: { status: client_1.OrderStatus.CANCELLED },
    });
    res.json(order);
};
exports.cancelOrder = cancelOrder;
//# sourceMappingURL=order.controller.js.map