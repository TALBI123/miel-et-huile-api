import { Router } from "express";
import * as reviewController from "../controller/review.controller";
import { verifyToken, verifyAdmin } from "../middlewares/auth";
import { validate } from "../middlewares/validate";
import { getAllReviewSchema, reviewSchemas } from "../schema/review.schema";

const router = Router();

/**
 * @swagger
 * tags:
 *   - name: Admin - Reviews
 *     description: |
 *       Interface de modération et d'administration pour la gestion complète des avis produits.
 *       Accessible uniquement aux administrateurs avec des permissions étendues.
 */

/**
 * @swagger
 * /admin/reviews:
 *   get:
 *     summary: Récupérer tous les avis de tous les produits (Admin uniquement)
 *     tags: [Admin - Reviews]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: page
 *         in: query
 *         schema:
 *           type: integer
 *           default: 1
 *       - name: limit
 *         in: query
 *         schema:
 *           type: integer
 *           default: 10
 *       - name: status
 *         in: query
 *         schema:
 *           type: string
 *           enum: [approved, pending, all]
 *           default: all
 *       - name: productId
 *         in: query
 *         schema:
 *           type: string
 *         description: Filtrer par produit (optionnel)
 *       - name: userId
 *         in: query
 *         schema:
 *           type: string
 *         description: Filtrer par utilisateur (optionnel)
 *       - name: rating
 *         in: query
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 5
 *         description: Filtrer par note (optionnel)
 *     responses:
 *       200:
 *         description: Liste de tous les avis récupérée avec succès
 */
router.get(
  "/",
  verifyToken,
  verifyAdmin,
  validate({
    schema: getAllReviewSchema,
    key: "query",
    skipSave: true,
  }),
  reviewController.getAllReviewsGlobal
);
/**
 * @swagger
 * /admin/reviews/{id}/toggle:
 *   patch:
 *     summary: Basculer le statut d'approbation d'un avis
 *     tags: [Admin - Reviews]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de l'avis
 *     responses:
 *       200:
 *         description: Statut basculé avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Avis approuvé avec succès"
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     isApproved:
 *                       type: boolean
 *                       example: true
 *                     rating:
 *                       type: integer
 *                     comment:
 *                       type: string
 *                     user:
 *                       type: object
 *                     product:
 *                       type: object
 *       404:
 *         description: Avis non trouvé
 */

router.patch(
  "/:id/toggle",
  verifyToken,
  verifyAdmin,
  reviewController.toggleReviewApproval
);

/**
 * /products/{productId}/reviews:
 *   get:
 *     summary: Récupérer tous les avis d'un produit
 *     description: |
 *       Récupère la liste paginée des avis approuvés pour un produit spécifique.
 *       Accessible publiquement (pas besoin d'authentification).
 *     tags: [Reviews]
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID du produit
 *         example: "507f1f77bcf86cd799439011"
 *       - in: query
 *         name: page
 *         required: false
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Numéro de la page pour la pagination
 *         example: 1
 *       - in: query
 *         name: limit
 *         required: false
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *           default: 10
 *         description: Nombre d'avis par page
 *         example: 10
 *       - in: query
 *         name: rating
 *         required: false
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 5
 *         description: Filtrer par note spécifique
 *         example: 5
 *       - in: query
 *         name: sortBy
 *         required: false
 *         schema:
 *           type: string
 *           enum: [createdAt, rating, helpful]
 *           default: createdAt
 *         description: Champ de tri
 *       - in: query
 *         name: sortOrder
 *         required: false
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Ordre de tri
 *     responses:
 *       200:
 *         description: Liste des avis récupérée avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Avis récupérés avec succès"
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/ReviewResponse'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     currentPage:
 *                       type: integer
 *                       example: 1
 *                     totalPages:
 *                       type: integer
 *                       example: 3
 *                     totalItems:
 *                       type: integer
 *                       example: 25
 *                     hasNext:
 *                       type: boolean
 *                       example: true
 *                     hasPrev:
 *                       type: boolean
 *                       example: false
 *                 summary:
 *                   type: object
 *                   properties:
 *                     averageRating:
 *                       type: number
 *                       format: float
 *                       example: 4.2
 *                     totalReviews:
 *                       type: integer
 *                       example: 25
 *                     ratingDistribution:
 *                       type: object
 *                       properties:
 *                         "5":
 *                           type: integer
 *                           example: 12
 *                         "4":
 *                           type: integer
 *                           example: 8
 *                         "3":
 *                           type: integer
 *                           example: 3
 *                         "2":
 *                           type: integer
 *                           example: 1
 *                         "1":
 *                           type: integer
 *                           example: 1
 *       400:
 *         description: Paramètres invalides
 *       404:
 *         description: Produit non trouvé
 */
router.delete(
  "/:id",
  verifyToken,
  verifyAdmin,
  reviewController.deleteReviewGlobal
);

/**
 * @swagger
 * /admin/reviews/stats:
 *   get:
 *     summary: Statistiques globales des avis
 *     tags: [Admin - Reviews]
 *     security:
 *       - bearerAuth: []
 */

// router.get('/stats',
//   verifyToken,
//   verifyAdmin,
//   reviewController.getReviewsStatsGlobal
// );


export default router;
