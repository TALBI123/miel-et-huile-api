import { createReview } from "../controller/review.controller";
import { verifyToken, verifyAdmin, optionalAuth } from "../middlewares/auth";
import { Router } from "express";
import * as reviewController from "../controller/review.controller";
import { reviewSchemas } from "../schema/review.schema";
import { validate } from "../middlewares/validate";
import { ValidationId } from "../schema/validation.shema";

const router = Router({ mergeParams: true }); // Important pour accéder aux params du parent

/**
 * @swagger
 * tags:
 *   - name: Reviews
 *     description: |
 *       Système complet de gestion des avis clients permettant aux utilisateurs de partager 
 *       leur expérience d'achat et aux visiteurs de consulter les retours produits.
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     ReviewInput:
 *       type: object
 *       required:
 *         - rating
 *         - comment
 *       properties:
 *         rating:
 *           type: integer
 *           minimum: 1
 *           maximum: 5
 *           description: Note donnée au produit (1-5 étoiles)
 *           example: 5
 *         comment:
 *           type: string
 *           minLength: 10
 *           maxLength: 1000
 *           description: Commentaire de l'utilisateur sur le produit
 *           example: "Excellent miel, très savoureux et de qualité!"
 *         title:
 *           type: string
 *           minLength: 5
 *           maxLength: 100
 *           description: Titre de l'avis (optionnel)
 *           example: "Produit de qualité exceptionnelle"
 *     
 *     ReviewResponse:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: ID unique de l'avis
 *         rating:
 *           type: integer
 *           minimum: 1
 *           maximum: 5
 *         comment:
 *           type: string
 *         title:
 *           type: string
 *         isApproved:
 *           type: boolean
 *           description: Statut d'approbation de l'avis
 *         user:
 *           type: object
 *           properties:
 *             id:
 *               type: string
 *             firstName:
 *               type: string
 *             lastName:
 *               type: string
 *         product:
 *           type: object
 *           properties:
 *             id:
 *               type: string
 *             name:
 *               type: string
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
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
router.get("/",
  optionalAuth,
  validate({ schema: ValidationId, key: "params" }),
  validate({
    schema: reviewSchemas.getReviews,
    key: "query",
    skipSave: true,
  }),
  reviewController.getReviewsByProduct
);

/**
 * @swagger
 * /products/{productId}/reviews:
 *   post:
 *     summary: Créer un nouvel avis pour un produit
 *     description: |
 *       Permet à un utilisateur authentifié de créer un avis pour un produit.
 *       L'avis sera en attente d'approbation par un administrateur.
 *       Un utilisateur ne peut créer qu'un seul avis par produit.
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID du produit à évaluer
 *         example: "507f1f77bcf86cd799439011"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ReviewInput'
 *           examples:
 *             exemple1:
 *               summary: Avis complet avec titre
 *               value:
 *                 rating: 5
 *                 comment: "Excellent miel, très savoureux et de qualité! Je recommande vivement ce produit à tous les amateurs de miel."
 *                 title: "Produit de qualité exceptionnelle"
 *             exemple2:
 *               summary: Avis simple sans titre
 *               value:
 *                 rating: 4
 *                 comment: "Bon produit, livraison rapide. Le goût est authentique et correspond à mes attentes."
 *     responses:
 *       201:
 *         description: Avis créé avec succès
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
 *                   example: "Avis créé avec succès et en attente d'approbation"
 *                 data:
 *                   $ref: '#/components/schemas/ReviewResponse'
 *       400:
 *         description: Données invalides ou avis déjà existant
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
 *                   example: "Vous avez déjà donné un avis pour ce produit"
 *       401:
 *         description: Non authentifié
 *       404:
 *         description: Produit non trouvé
 *       422:
 *         description: Erreurs de validation
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
 *                   example: "Erreurs de validation"
 *                 errors:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       field:
 *                         type: string
 *                         example: "comment"
 *                       message:
 *                         type: string
 *                         example: "Le commentaire doit contenir au moins 10 caractères"
 */
router.post("/",
  verifyToken,
  validate({ schema: ValidationId, key: "params" }),
  validate({ schema: reviewSchemas.createReview, skipSave: true }),
  reviewController.createReview
);

export default router;
