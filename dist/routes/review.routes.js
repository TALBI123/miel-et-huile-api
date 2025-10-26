"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const review_controller_1 = require("../controller/review.controller");
const auth_1 = require("../middlewares/auth");
const express_1 = require("express");
const router = (0, express_1.Router)();
// ✅ Créer une review
router.post("/", auth_1.verifyToken, review_controller_1.createReview);
// // ✅ Obtenir toutes les reviews d’un produit
// router.get("/product/:productId", reviewController.getReviewsByProduct);
// // ✅ Obtenir toutes les reviews (admin)
// router.get("/", verifyAdmin, reviewController.getAllReviews);
// // ✅ Approuver ou rejeter une review (admin)
// router.patch("/:id/approve", verifyAdmin, reviewController.approveReview);
// // ✅ Supprimer une review
// router.delete("/:id", verifyAdmin, reviewController.deleteReview);
exports.default = router;
//# sourceMappingURL=review.routes.js.map