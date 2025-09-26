import {
  createCategory,
  deleteCategory,
  getAllCategorys,
  getCategoryById,
  updateCategory,
} from "../controller/categorys.controller";
import { Router } from "express";
import { verifyAdmin, verifyToken } from "../middlewares/auth";
import {
  uploadHandler,
  uploadMemoryStorage,
} from "../middlewares/uploadMiddleware";
import { validate } from "../middlewares/validate";
import {
  CreateCategorySchema,
  PaginationSchema,
  ValidationId,
} from "../schema/validation.shema";
const router = Router();

/**
 * @swagger
 * tags:
 *   - name: Catégories
 *     description: Gestion des catégories (CRUD, affichage, détails)
 */

// --- PUBLIC CATEGORY ROUTES

/**
 * @swagger
 * /categories:
 *   get:
 *     summary: Récupère toutes les catégories avec pagination
 *     tags:
 *       - Catégories
 *     parameters:
 *       - in: query
 *         name: page
 *         required: false
 *         schema:
 *           type: integer
 *           example: 1
 *         description: Numéro de la page pour la pagination
 *       - in: query
 *         name: limit
 *         required: false
 *         schema:
 *           type: integer
 *           example: 10
 *         description: Nombre d'éléments par page
 *     responses:
 *       200:
 *         description: Liste des catégories récupérée avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       name:
 *                         type: string
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *             example:
 *               success: true
 *               data:
 *                 - id: "64f2c5e7b5e7e72f12345678"
 *                   name: "Miels"
 *                   createdAt: "2025-09-23T17:00:00Z"
 *                 - id: "64f2c5e7b5e7e72f12345679"
 *                   name: "Pollen"
 *                   createdAt: "2025-09-23T17:10:00Z"
 *       404:
 *         description: Aucune catégorie trouvée
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 success: false
 *                 message: "Catégorie non trouvée"
 *       500:
 *         description: Erreur interne du serveur
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 success: false
 *                 message: "Une erreur est survenue côté serveur"
 */

router.get(
  "/",
  validate({ schema: PaginationSchema, key: "query",skipSave:true }),
  getAllCategorys
);
/**
 * @swagger
 * /categories/{id}:
 *   get:
 *     summary: Récupère une catégorie par son ID
 *     tags:
 *       - Catégories
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           example: "64f2c5e7b5e7e72f12345678"
 *         description: ID de la catégorie à récupérer
 *     responses:
 *       200:
 *         description: Catégorie récupérée avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     name:
 *                       type: string
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *             example:
 *               success: true
 *               data:
 *                 id: "64f2c5e7b5e7e72f12345678"
 *                 name: "Miels"
 *                 createdAt: "2025-09-23T17:00:00Z"
 *       404:
 *         description: Catégorie non trouvée
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 success: false
 *                 message: "Catégorie non trouvée"
 *       500:
 *         description: Erreur interne du serveur
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 success: false
 *                 message: "Une erreur est survenue côté serveur"
 */
router.get(
  "/:id",
  validate({ schema: ValidationId, key: "params" }),
  getCategoryById
);

// --- AdMIN CATEGORY CRUD OPERATIONS


/**
 * @swagger
 * /categorys/:
 *   post:
 *     summary: Crée une nouvelle catégorie (Admin)
 *     tags:
 *       - Catégories
 *     security:
 *       - cookieAuth: []  # Nécessite un token pour authentification
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Miels"
 *                 description: Nom de la catégorie
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: Image représentant la catégorie
 *     responses:
 *       201:
 *         description: Catégorie créée avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       example: "64f2c5e7b5e7e72f12345678"
 *                     name:
 *                       type: string
 *                       example: "Miels"
 *                     imageUrl:
 *                       type: string
 *                       example: "http://localhost:3000/images/miel.jpg"
 *       401:
 *         description: Non authentifié / token manquant ou invalide
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
 *                   example: "Token invalide ou expiré"
 *       403:
 *         description: Accès refusé (non-admin)
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
 *                   example: "Accès refusé : Admin requis"
 *       500:
 *         description: Erreur interne du serveur
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
 *                   example: "Une erreur est survenue côté serveur"
 */

router.post(
  "/",
  verifyToken,
  // verifyAdmin,
  uploadMemoryStorage,
  uploadHandler,
  validate({ schema: CreateCategorySchema }),
  createCategory
);
/**
 * @swagger
 * /categories/{id}:
 *   patch:
 *     summary: Met à jour une catégorie existante
 *     tags:
 *       - Catégories
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           example: "64f2c5e7b5e7e72f12345678"
 *         description: ID de la catégorie à mettre à jour
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Nouveau nom de la catégorie
 *                 example: "Miels et Pollen"
 *               description:
 *                 type: string
 *                 description: Description de la catégorie
 *                 example: "Catégorie regroupant tous les miels et pollens"
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: Nouvelle image de la catégorie
 *     responses:
 *       200:
 *         description: Catégorie mise à jour avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 success: true
 *                 message: "Catégorie mise à jour avec succès"
 *                 data:
 *                   id: "64f2c5e7b5e7e72f12345678"
 *       400:
 *         description: Aucune donnée valide fournie pour la mise à jour
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 success: false
 *                 message: "Aucune donnée valide fournie pour la mise à jour"
 *       404:
 *         description: Catégorie non trouvée
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 success: false
 *                 message: "Catégorie non trouvée"
 *       500:
 *         description: Erreur interne du serveur
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 success: false
 *                 message: "Une erreur est survenue côté serveur"
 */

router.patch(
  "/:id",
  verifyToken,
  verifyAdmin,
  uploadMemoryStorage,
  validate({ schema: CreateCategorySchema.partial() }),
  validate({ schema: ValidationId, key: "params" }),
  updateCategory
);
/**
 * @swagger
 * /categories/{id}:
 *   delete:
 *     summary: Supprime une catégorie existante
 *     tags:
 *       - Catégories
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           example: "64f2c5e7b5e7e72f12345678"
 *         description: ID de la catégorie à supprimer
 *     responses:
 *       200:
 *         description: Catégorie supprimée avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 success: true
 *                 message: "La catégorie a été supprimée avec succès"
 *       404:
 *         description: Catégorie non trouvée
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 success: false
 *                 message: "Category n'existe pas"
 *       500:
 *         description: Erreur interne du serveur
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 success: false
 *                 message: "Une erreur est survenue côté serveur"
 */

router.delete(
  "/:id",
  verifyToken,
  // verifyAdmin,
  validate({ schema: ValidationId, key: "params" }),
  deleteCategory
);

export default router;
