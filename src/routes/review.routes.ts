import { createReview } from "../controller/review.controller";
import { verifyToken, verifyAdmin, optionalAuth } from "../middlewares/auth";
import { Router } from "express";
import * as reviewController from "../controller/review.controller";
import { reviewSchemas } from "../schema/review.schema";
import { validate } from "../middlewares/validate";
const router = Router({ mergeParams: true }); // Important pour accéder aux params du parent

// // ✅ Obtenir toutes les reviews (admin)
// router.get("/", verifyToken, verifyAdmin, reviewController.getAllReviews);
router.get("/", optionalAuth, reviewController.getReviewsByProduct);
// ✅ Créer une review
router.post(
  "/",
  verifyToken,
  validate({ schema: reviewSchemas.createReview, skipSave: true }),
  reviewController.createReview
);

// // ✅ Obtenir toutes les reviews d’un produit
// router.get("/product/:productId", reviewController.getReviewsByProduct);

// // ✅ Approuver ou rejeter une review (admin)
// router.patch("/:id/approve", verifyAdmin, reviewController.approveReview);

// // ✅ Supprimer une review
// router.delete("/:id", verifyAdmin, reviewController.deleteReview);

export default router;
