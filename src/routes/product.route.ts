import { Router } from "express";
import {
  uploadHandler,
  uploadMemoryStorage,
} from "../middlewares/uploadMiddleware";
import { validate } from "../middlewares/validate";
import {
  createProduct,
  deleteProduct,
  getProducts,
  getProductById,
  updateProduct,
} from "../controller/product.controller";
import {
  createProductShema,
  QuerySchema,
  ValidationId,
} from "../schema/validation.shema";
import { verifyAdmin, verifyToken } from "../middlewares/auth";
const router = Router();
// --- PUBLIC CATEGORY ROUTES
/**
 * @swagger
 * tags:
 *   - name: Produits
 *     description: Gestion des produits (CRUD, affichage, détails)
 */

/**
 * @swagger
 * /products:
 *   get:
 *     summary: Récupère la liste des produits avec filtres et pagination
 *     tags:
 *       - Produits
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Numéro de la page pour la pagination (par défaut 1)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Nombre de produits par page (par défaut 10)
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Nom de la catégorie pour filtrer les produits
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Terme de recherche pour filtrer les produits par titre
 *       - in: query
 *         name: onSale
 *         schema:
 *           type: boolean
 *         description: Filtrer les produits en promotion
 *       - in: query
 *         name: minPrice
 *         schema:
 *           type: number
 *           minimum: 0
 *         description: Prix minimum pour filtrer les produits
 *       - in: query
 *         name: maxPrice
 *         schema:
 *           type: number
 *           minimum: 0
 *         description: Prix maximum pour filtrer les produits
 *       - in: query
 *         name: inStock
 *         schema:
 *           type: boolean
 *         description: Filtrer uniquement les produits en stock
 *     responses:
 *       200:
 *         description: Liste des produits récupérée avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/IntProduct'
 *       404:
 *         description: Aucun produit trouvé avec les critères fournis
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
 *                   example: "Aucun produit trouvé"
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
router.get(
  "/",
  validate({ schema: QuerySchema, key: "query", skipSave: true }),
  getProducts
);
/**
 * @swagger
 * /products/{id}:
 *   get:
 *     summary: Récupère les détails d'un produit par son ID
 *     tags:
 *       - Produits
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           example: "64f2c5e7b5e7e72f12345678"
 *         description: ID du produit à récupérer
 *     responses:
 *       200:
 *         description: Produit récupéré avec succès
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
 *                     title:
 *                       type: string
 *                     price:
 *                       type: number
 *                     stock:
 *                       type: integer
 *                     category:
 *                       type: object
 *                       properties:
 *                         name:
 *                           type: string
 *                     onSale:
 *                       type: boolean
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *               example:
 *                 success: true
 *                 data:
 *                   id: "64f2c5e7b5e7e72f12345678"
 *                   title: "Miel de Lavande"
 *                   price: 12.5
 *                   stock: 25
 *                   category:
 *                     name: "Miels"
 *                   onSale: false
 *                   createdAt: "2025-09-23T17:00:00Z"
 *       404:
 *         description: Produit non trouvé
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *               example:
 *                 success: false
 *                 message: "Produit non trouvé"
 *       500:
 *         description: Erreur interne du serveur
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *               example:
 *                 success: false
 *                 message: "Une erreur est survenue côté serveur"
 */

router.get(
  "/:id",
  validate({ schema: ValidationId, key: "params" }),
  getProductById
);

// --- Private Product Routes

/**
 * @swagger
 * /products:
 *   post:
 *     summary: Crée un nouveau produit
 *     tags:
 *       - Produits
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 description: Nom du produit
 *                 example: "Miel de Lavande"
 *               price:
 *                 type: number
 *                 description: Prix initial du produit
 *                 example: 12.5
 *               stock:
 *                 type: integer
 *                 description: Quantité en stock
 *                 example: 25
 *               categoryId:
 *                 type: string
 *                 description: ID de la catégorie du produit
 *                 example: "64f2c5e7b5e7e72f12345678"
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: Image du produit
 *               discountPrice:
 *                 type: number
 *                 description: Prix de réduction (optionnel)
 *                 example: 10
 *               discountPercentage:
 *                 type: number
 *                 description: Pourcentage de réduction (optionnel)
 *                 example: 20
 *             required:
 *               - title
 *               - price
 *               - stock
 *               - categoryId
 *               - image
 *     responses:
 *       201:
 *         description: Produit créé avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *             example:
 *               success: true
 *               message: "Produit créé avec succès"
 *               data:
 *                 id: "64f2c5e7b5e7e72f12345678"
 *                 title: "Miel de Lavande"
 *                 price: 12.5
 *                 discountPrice: 10
 *                 discountPercentage: 20
 *                 stock: 25
 *                 categoryId: "64f2c5e7b5e7e72f12345678"
 *                 isOnSale: true
 *                 image: "https://res.cloudinary.com/…/image.jpg"
 *                 publicId: "products/xyz123"
 *                 createdAt: "2025-09-23T17:00:00Z"
 *       400:
 *         description: Requête invalide (prix et pourcentage de réduction incorrects)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 success: false
 *                 message: "Choisissez soit un prix de remise, soit un pourcentage, mais pas les deux."
 *       409:
 *         description: Conflit – le produit existe déjà
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 success: false
 *                 message: "Ce produit existe déjà"
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

router.post(
  "/",
  verifyToken,
  verifyAdmin,
  uploadMemoryStorage.single("image"),
  uploadHandler,
  validate({ schema: createProductShema, skipSave: true }),
  createProduct
);

/**
 * @swagger
 * /products/{id}:
 *   put:
 *     summary: Met à jour un produit existant
 *     tags:
 *       - Produits
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           example: "64f2c5e7b5e7e72f12345678"
 *         description: ID du produit à mettre à jour
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 description: Nom du produit
 *                 example: "Miel de Lavande"
 *               price:
 *                 type: number
 *                 description: Prix initial du produit
 *                 example: 12.5
 *               discountPrice:
 *                 type: number
 *                 description: Prix de réduction (optionnel)
 *                 example: 10
 *               discountPercentage:
 *                 type: number
 *                 description: Pourcentage de réduction (optionnel)
 *                 example: 20
 *               stock:
 *                 type: integer
 *                 description: Quantité en stock
 *                 example: 25
 *               categoryId:
 *                 type: string
 *                 description: ID de la catégorie du produit
 *                 example: "64f2c5e7b5e7e72f12345678"
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: Nouvelle image du produit
 *     responses:
 *       200:
 *         description: Produit mis à jour avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 success: true
 *                 message: "Produit mis à jour avec succès"
 *       400:
 *         description: Requête invalide (données invalides ou conflit prix/remise)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 success: false
 *                 message: "Choisissez soit un prix de remise, soit un pourcentage, mais pas les deux."
 *       404:
 *         description: Produit non trouvé
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 success: false
 *                 message: "Produit non trouvé"
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

router.put(
  "/:id",
  verifyToken,
  verifyAdmin,
  uploadMemoryStorage.single("image"),
  validate({ schema: ValidationId, key: "params" }),
  validate({ schema: createProductShema.partial(), skipSave: true }),
  updateProduct
);

/**
 * @swagger
 * /products/{id}:
 *   delete:
 *     summary: Supprime un produit existant
 *     tags:
 *       - Produits
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           example: "64f2c5e7b5e7e72f12345678"
 *         description: ID du produit à supprimer
 *     responses:
 *       200:
 *         description: Produit supprimé avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 success: true
 *                 message: "Produit supprimé avec succès"
 *       404:
 *         description: Produit non trouvé
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 success: false
 *                 message: "Produit non trouvé"
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
  verifyAdmin,
  validate({ schema: createProductShema.partial(), skipSave: true }),
  deleteProduct
);

export default router;
