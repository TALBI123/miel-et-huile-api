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
 * @swagger
 * /admin/reviews/{id}:
 *   delete:
 *     summary: Supprimer un avis (Admin uniquement)
 *     description: |
 *       Supprime définitivement un avis spécifique de la base de données.
 *       Accessible uniquement aux administrateurs.
 *     tags: [Admin - Reviews]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de l'avis à supprimer
 *         example: "507f1f77bcf86cd799439011"
 *     responses:
 *       200:
 *         description: Avis supprimé avec succès
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
 *                   example: "Avis supprimé avec succès"
 *       404:
 *         description: Avis non trouvé
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Avis non trouvé"
 *       401:
 *         description: Non autorisé - Token manquant ou invalide
 *       403:
 *         description: Accès refusé - Droits administrateur requis
 */
router.delete(
  "/:id",
  verifyToken,
  verifyAdmin,
  reviewController.deleteReviewGlobal
);



// router.get('/stats',
//   verifyToken,
//   verifyAdmin,
//   reviewController.getReviewsStatsGlobal
// );


export default router;
