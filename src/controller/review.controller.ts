import { handleServerError, timeAgo } from "../utils/helpers";
import { StatusCodes } from "http-status-codes";
import { Request, Response } from "express";
import prisma from "../config/db";
import { QueryBuilderService } from "../services/queryBuilder.service";
import { ReviewStatus } from "../types/enums";
// ---------------------- Public functions for reviews

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
  const { limit, page } = res.locals.validated;
  console.log(
    res.locals.validated,
    " res.locals.validated in getReviewsByProduct"
  );
  const existingProduct = await prisma.product.findUnique({
    where: { id },
    select: { id: true },
  });
  if (!existingProduct)
    return res.status(StatusCodes.NOT_FOUND).json({
      success: false,
      message: "Produit non trouvé",
    });

  const query = QueryBuilderService.buildAdvancedQuery("review", {
    ...res.locals.validated,
    extraWhere: { productId: id },
    include: {
      user: {
        select: { id: true, firstName: true, lastName: true },
      },
    },
  });
  console.log(query, " query in getReviewsByProduct");
  // 1️⃣ Récupérer les avis du produit
  const [reviews, reviewsCount] = await Promise.all([
    prisma.review.findMany(query),
    prisma.review.count({ where: query.where }),
  ]);
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
  res.status(StatusCodes.OK).json({
    success: true,
    data: reviews,
    hasOrder: Boolean(hasOrder),
    pagination: {
      total: reviewsCount,
      page,
      limit,
      lastPage: QueryBuilderService.calculateLastPage(reviewsCount, limit),
    },
  });
};

// ---------------------- Private functions for reviews

export const getAllReviewsGlobal = async (req: Request, res: Response) => {
  try {
    const { limit, page, status } = res.locals.validated;

    const query = QueryBuilderService.buildAdvancedQuery("review", {
      ...res.locals.validated,
      extraWhere: {
        ...(status && status !== "all"
          ? {
              isApproved: status === ReviewStatus.APPROVED,
            }
          : {}),
      },
      include: {
        product: { select: { id: true, title: true } },
        user: {
          select: { id: true, email: true, firstName: true, lastName: true },
        },
      },
    });
    console.log(query, " query in getAllReviewsGlobal");
    const [reviews, reviewsCount] = await Promise.all([
      prisma.review.findMany(query),
      prisma.review.count({ where: query.where }),
    ]);

    res.status(StatusCodes.OK).json({
      success: true,
      data: reviews,
      pagination: {
        total: reviewsCount,
        page,
        limit,
        lastPage: QueryBuilderService.calculateLastPage(reviewsCount, limit),
      },
    });
  } catch (err) {
    handleServerError(res, err);
  }
};

export const toggleReviewApproval = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const review = await prisma.review.findUnique({
      where: { id },
      select: { isApproved: true },
    });
    if (!review)
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: "Review not found",
      });

    const updatedReview = await prisma.review.update({
      where: { id },
      data: { isApproved: !review.isApproved },
    });
    res.json({
      success: true,
      message: `Review ${
        updatedReview.isApproved ? "approved" : "disapproved"
      } successfully`,
      data: updatedReview,
    });
  } catch (err) {
    handleServerError(res, err);
  }
};

export const deleteReviewGlobal = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const existingReview = await prisma.review.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!existingReview)
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: "Review not found",
      });
    await prisma.review.delete({
      where: { id },
    });
    res.status(StatusCodes.NO_CONTENT).json({
      success: true,
      message: "Review deleted successfully",
    });
  } catch (err) {
    handleServerError(res, err);
  }
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
