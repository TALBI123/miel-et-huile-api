import { OrderStatus, PrismaClient } from "@prisma/client";
import { handleServerError, timeAgo } from "../utils/helpers";
import { StatusCodes } from "http-status-codes";
import { Request, Response } from "express";

export const createReview = async (req: Request, res: Response) => {
  const { productId, rating, title, comment } = res.locals.validated;
  const userId = req.user?.id; // depuis verifyToken
  try {
    const review = await reviewService.createReview({
      productId,
      userId,
      rating,
      title,
      comment,
    });

    res.status(201).json(review);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
};

// export const getReviewsByProduct = async (req: Request, res: Response) => {
//   const { productId } = req.params;
//   const reviews = await reviewService.getReviewsByProduct(productId);
//   res.json(reviews);
// };

// export const getAllReviews = async (req: Request, res: Response) => {
//   const reviews = await reviewService.getAllReviews();
//   res.json(reviews);
// };

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
