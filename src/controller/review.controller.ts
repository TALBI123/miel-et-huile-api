import { OrderStatus, PrismaClient } from "@prisma/client";
import { handleServerError, timeAgo } from "../utils/helpers";
import { StatusCodes } from "http-status-codes";
import { Request, Response } from "express";
import prisma from "../config/db";

export const getAllReviews = async (req: Request, res: Response) => {
  try {
    const reviews = await prisma.review.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        product: { select: { id: true, title: true } },
        user: {
          select: { id: true, email: true, firstName: true, lastName: true },
        },
      },
    });
    res.json(reviews);
  } catch (err) {
    handleServerError(res, err);
  }
};

export const createReview = async (req: Request, res: Response) => {
  const { rating, title, comment } = res.locals.validated;
  const userId = req.user?.id!; // depuis verifyToken
  const { id } = req.params;

  try {
    const existingProduct = await prisma.product.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!existingProduct)
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: "Produit non trouvé",
      });
      
    const hasOrder = await prisma.orderItem.findFirst({
      where: {
        productId: id,
        order: { userId, paymentStatus: "PAID" },
      },
    });

    await prisma.review.create({
      data: {
        comment,
        rating,
        title,
        userId,
        productId: id,
        isVerified: Boolean(hasOrder),
      },
    });
    // res.status(201).json(review);
    res.status(StatusCodes.CREATED).json({
      success: true,
      message: "Review créée avec succès",
    });
  } catch (err: any) {
    if (err.code === "P2002")
      // unique constraint failed
      return res
        .status(409)
        .json({ message: "Vous avez déjà laissé un avis pour ce produit." });

    res.status(400).json({ error: err.message });
  }
};

export const getReviewsByProduct = async (req: Request, res: Response) => {
  const { id } = req.params;
  const existingProduct = await prisma.product.findUnique({
    where: { id },
    select: { id: true },
  });
  if (!existingProduct)
    return res.status(StatusCodes.NOT_FOUND).json({
      success: false,
      message: "Produit non trouvé",
    });

  // 1️⃣ Récupérer les avis du produit
  const reviews = await prisma.review.findMany({
    where: { productId: id },
    include: {
      user: {
        select: { id: true, firstName: true, lastName: true },
      },
    },
  });

  // 2️⃣ Vérifier si l'utilisateur a acheté le produit
  console.log("Checking if user has ordered the product...");
  const hasOrder =
    req.user &&
    (await prisma.orderItem.findFirst({
      where: {
        productId: id,
        order: {
          userId: req.user?.id,
          // status: OrderStatus.DELIVERED,// Seulement les commandes livrées
          paymentStatus: "PAID",
        },
      },
      include: {
        order: true,
      },
    }));
  console.log(hasOrder, " hasOrder in getReviewsByProduct");

  console.log(hasOrder, " hasOrder in getReviewsByProduct");
  res.status(StatusCodes.OK).json({
    success: true,
    data: reviews,
    hasOrder: Boolean(hasOrder),
  });
};

// export const approveReview = async (req: Request, res: Response) => {
//   const { id } = req.params;
//   const review = await reviewService.approveReview(id);
//   res.json(review);
// };

// export const deleteReview = async (req: Request, res: Response) => {
//   const { id } = req.params;
//   await reviewService.deleteReview(id);
//   res.status(204).send();
// };
