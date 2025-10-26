"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createReview = void 0;
const http_status_codes_1 = require("http-status-codes");
const createReview = async (req, res) => {
    const { productId, rating, title, comment } = res.locals.validated;
    const userId = req.user?.id; // depuis verifyToken
    try {
        // const review = await reviewService.createReview({
        //   productId,
        //   userId,
        //   rating,
        //   title,
        //   comment,
        // });
        // res.status(201).json(review);
        res.status(http_status_codes_1.StatusCodes.CREATED).json({
            success: true,
            message: "Review créée avec succès",
        });
    }
    catch (err) {
        res.status(400).json({ error: err.message });
    }
};
exports.createReview = createReview;
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
//# sourceMappingURL=review.controller.js.map