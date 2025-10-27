import { createReview } from "../controller/review.controller";
import { verifyToken, verifyAdmin } from "../middlewares/auth";
import { Router } from "express";
const router = Router({ mergeParams: true }); // Important pour accéder aux params du parent

// ✅ Créer une review
router.post("/", verifyToken, createReview);

// // ✅ Obtenir toutes les reviews d’un produit
// router.get("/product/:productId", reviewController.getReviewsByProduct);

// // ✅ Obtenir toutes les reviews (admin)
// router.get("/", verifyAdmin, reviewController.getAllReviews);

// // ✅ Approuver ou rejeter une review (admin)
// router.patch("/:id/approve", verifyAdmin, reviewController.approveReview);

// // ✅ Supprimer une review
// router.delete("/:id", verifyAdmin, reviewController.deleteReview);

export default router;
