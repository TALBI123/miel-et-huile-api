import { Router } from 'express';
import * as reviewController from '../controller/review.controller';
import { verifyToken, verifyAdmin } from '../middlewares/auth';
import { validate } from '../middlewares/validate';
import { reviewSchemas } from '../schema/review.schema';

const router = Router();

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
router.get('/', 
  verifyToken, 
  verifyAdmin,
  validate({ 
    schema: reviewSchemas.getReviews, 
    key: "query",
    skipSave: true 
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
router.patch('/:id/toggle', 
  verifyToken, 
  verifyAdmin,
  reviewController.toggleReviewApproval
);
/**
 * @swagger
 * /admin/reviews/{id}:
 *   delete:
 *     summary: Supprimer un avis (action globale)
 *     tags: [Admin - Reviews]
 *     security:
 *       - bearerAuth: []
 */
router.delete('/:id', 
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

// /**
//  * @swagger
//  * /admin/reviews/bulk/approve:
//  *   patch:
//  *     summary: Approuver plusieurs avis en lot
//  *     tags: [Admin - Reviews]
//  *     security:
//  *       - bearerAuth: []
//  */
// router.patch('/bulk/approve', 
//   verifyToken, 
//   verifyAdmin,
//   validate({
//     schema: reviewSchemas.bulkAction,
//     key: "body"
//   }),
//   reviewController.bulkApproveReviews
// );




export default router;