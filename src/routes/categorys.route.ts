import {
  getAllCategorys,
  getCategoryById,
  createCategory,
  deleteCategory,
  updateCategory,
} from "../controller/categorys.controller";
import { Router } from "express";
import { verifyAdmin, verifyToken } from "../middlewares/auth";
import {
  uploadHandler,
  uploadMemoryStorage,
} from "../middlewares/uploadMiddleware";
import { checkEmptyRequestBody, validate } from "../middlewares/validate";
import {
  categorySlug,
  FilterSchema,
  ValidationId,
} from "../schema/validation.shema";
import { CreateCategorySchema } from "../schema/category.shema";
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
 * /categorys:
 *   get:
 *     summary: Récupérer la liste des catégories avec le nombre de produits
 *     description: >
 *       Cette route permet de récupérer toutes les catégories, avec des informations détaillées sur chaque catégorie, y compris :
 *         - `productsCount` : le nombre de produits associés à chaque catégorie.
 *         - `createdAt` et `updatedAt` : les dates de création et de mise à jour.
 *       Elle supporte des filtres et options de pagination via les **query params**.
 *       Les champs possibles pour filtrer ou trier sont :
 *         - `page` (number) : numéro de page pour la pagination.
 *         - `limit` (number) : nombre de résultats par page.
 *         - `search` (string) : recherche par nom ou description de catégorie.
 *         - `mode` (enum) : filtrage des catégories selon leur contenu en produits :
 *             - `all` : récupère toutes les catégories.
 *             - `with` : récupère uniquement les catégories qui contiennent des produits.
 *             - `without` : récupère uniquement les catégories sans produits.
 *       Cette route renvoie un tableau de catégories avec leur nombre de produits.
 *         - Filtrer uniquement les catégories actives via `isActive`
 *     tags:
 *       - Catégories
 *     parameters:
 *       - $ref: '#/components/parameters/PageParam'
 *       - $ref: '#/components/parameters/LimitParam'
 *       - $ref: '#/components/parameters/SearchParam'
 *       - $ref: '#/components/parameters/ModeParam'
 *       - name: isActive
 *         in: query
 *         required: false
 *         description: Filtrer uniquement les catégories actives
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: Succès, renvoie la liste des catégories
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
 *                       slug:
 *                         type: string
 *                       description:
 *                         type: string
 *                       image:
 *                         type: string
 *                       publicId:
 *                         type: string
 *                       productsCount:
 *                         type: integer
 *                       isActive:
 *                         type: boolean
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                       updatedAt:
 *                         type: string
 *                         format: date-time
 *       404:
 *         description: Aucune catégorie trouvée
 *       500:
 *         description: Erreur serveur
 */
router.get(
  "/",
  validate({
    schema: FilterSchema,
    key: "query",
    skipSave: true,
  }),
  getAllCategorys
);
/**
 * @swagger
 * /categorys/{id}:
 *   get:
 *     summary: Récupérer une catégorie par son ID
 *     description: >
 *       Cette route permet de récupérer **une catégorie unique** en utilisant son ID.
 *       Si la catégorie existe, elle renvoie toutes ses informations.
 *       Si elle n'existe pas, renvoie une erreur 404.
 *     tags:
 *       - Catégories
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: L'ID de la catégorie à récupérer.
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
 *                     publicId:
 *                       type: string
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *       404:
 *         description: La catégorie n'existe pas
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       500:
 *         description: Erreur serveur inattendue
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 */

router.get(
  "/:id",
  validate({ schema: ValidationId, key: "params" }),
  getCategoryById
);

// --- AdMIN CATEGORY CRUD OPERATIONS

/**
 * @swagger
 * /categorys:
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
 * /categorys/{id}:
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
  validate({ schema: CreateCategorySchema.partial() ,skipSave:true}),
  validate({ schema: ValidationId, key: "params" }),
  checkEmptyRequestBody,
  updateCategory
);
/**
 * @swagger
 * /categorys/{id}:
 *   delete:
 *     summary: Supprimer une catégorie et tous ses produits associés
 *     description: >
 *       Cette route supprime une catégorie par son ID.
 *       La suppression est **en cascade** :
 *         - Tous les produits associés à cette catégorie sont supprimés.
 *         - Tous les variants des produits sont supprimés.
 *         - Toutes les images des produits sont supprimées de la base de données et de **Cloudinary**.
 *         - L'image principale de la catégorie est également supprimée de Cloudinary.
 *       Cette approche garantit que la base de données reste propre et que les fichiers médias ne restent pas sur Cloudinary après suppression.
 *       Le frontend peut utiliser la réponse pour mettre à jour son interface avec la liste des produits supprimés.
 *     tags:
 *       - Catégories
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: L'ID de la catégorie à supprimer.
 *     responses:
 *       200:
 *         description: Catégorie et produits supprimés avec succès.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 products:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *       404:
 *         description: La catégorie n'existe pas.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       500:
 *         description: Erreur serveur inattendue.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 */

router.delete(
  "/:id",
  verifyToken,
  // verifyAdmin,
  validate({ schema: ValidationId, key: "params" }),
  deleteCategory
);

export default router;
