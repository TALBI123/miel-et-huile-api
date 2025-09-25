import { Router } from "express";
import {
  uploadDiskMiddleware,
  uploadHandler,
  uploadMemoryStorage,
} from "../middlewares/uploadMiddleware";
import { validate } from "../middlewares/validate";
import {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  addProductImages,
  deleteProductImage,
  updateProductImage,
} from "../controller/product.controller";
import { QuerySchema, ValidationId } from "../schema/validation.shema";
import { verifyAdmin, verifyToken } from "../middlewares/auth";
import { handleValidationErrors } from "../middlewares/handleValidationMiddleware";
import {
  createProductShema,
  deleteProductImageSchema,
} from "../schema/product.shema";
// import { createProductVariant } from "../controller/product.controller";
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
 *     summary: Créer un nouveau produit
 *     description: |
 *       Cette route permet de créer un nouveau produit avec ses images.
 *       - Vérifie si un produit avec le même titre existe déjà.
 *       - Upload les images sur Cloudinary (maximum 4 images).
 *       - Enregistre le produit et ses images dans la base de données.
 *       - **Téléchargez jusqu'à 4 images maximum**
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
 *                 example: "Chaussures Nike Air"
 *               categoryId:
 *                 type: string
 *                 example: "c7d2c4c9-8f56-4c2a-a3a5-2d65e1f0c111"
 *               description:
 *                 type: string
 *                 example: "Des chaussures confortables et stylées"
 *               subDescription:
 *                 type: string
 *                 example: "Disponible en plusieurs tailles"
 *               images:
 *                 type: array
 *                 maxItems: 4
 *                 items:
 *                   type: string
 *                   format: binary
 *                   description: "Téléchargez jusqu'à 4 images maximum"
 *             required:
 *               - title
 *               - categoryId
 *               - subDescription
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
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Produit créé avec succès"
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       example: "fa32d83c-2c22-4c0f-832f-22a2b91f4a4a"
 *                     title:
 *                       type: string
 *                       example: "Chaussures Nike Air"
 *                     categoryId:
 *                       type: string
 *                       example: "c7d2c4c9-8f56-4c2a-a3a5-2d65e1f0c111"
 *                     description:
 *                       type: string
 *                     subDescription:
 *                       type: string
 *                     images:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             example: "img_1234"
 *                           image:
 *                             type: string
 *                             example: "https://res.cloudinary.com/demo/image/upload/v12345/sample.jpg"
 *                           publicId:
 *                             type: string
 *                             example: "products/sample"
 *       409:
 *         description: Produit déjà existant (titre en conflit)
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
 *                   example: "Ce produit existe déjà"
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
 *                   example: "Erreur interne du serveur"
 */

router.post(
  "/",
  verifyToken,
  verifyAdmin,
  uploadDiskMiddleware,
  validate({ schema: createProductShema, key: "body" }),
  createProduct
);

/**
 * @swagger
 * /products/{id}:
 *   patch:
 *     summary: Mettre à jour un produit existant
 *     description: |
 *       Cette route permet de mettre à jour un produit existant.
 *       - Vérifie si le produit existe.
 *       - Vérifie si la catégorie fournie existe si `categoryId` est présent.
 *       - Met à jour uniquement les propriétés valides fournies.
 *     tags:
 *       - Produits
 *     parameters:
 *       - name: id
 *         in: path
 *         description: ID du produit à mettre à jour
 *         required: true
 *         schema:
 *           type: string
 *           example: "fa32d83c-2c22-4c0f-832f-22a2b91f4a4a"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             description: Propriétés du produit à mettre à jour (optionnelles)
 *             properties:
 *               title:
 *                 type: string
 *                 example: "Chaussures Nike Air 2025"
 *               categoryId:
 *                 type: string
 *                 example: "c7d2c4c9-8f56-4c2a-a3a5-2d65e1f0c111"
 *               description:
 *                 type: string
 *                 example: "Nouvelle description du produit"
 *               subDescription:
 *                 type: string
 *                 example: "Nouvelle sous-description"
 *             additionalProperties: false
 *     responses:
 *       200:
 *         description: Produit mis à jour avec succès
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
 *                   example: "Produit mis à jour avec succès"
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       example: "fa32d83c-2c22-4c0f-832f-22a2b91f4a4a"
 *                     title:
 *                       type: string
 *                       example: "Chaussures Nike Air 2025"
 *                     categoryId:
 *                       type: string
 *                       example: "c7d2c4c9-8f56-4c2a-a3a5-2d65e1f0c111"
 *                     description:
 *                       type: string
 *                       example: "Nouvelle description du produit"
 *                     subDescription:
 *                       type: string
 *                       example: "Nouvelle sous-description"
 *       400:
 *         description: Requête invalide (aucune donnée valide ou catégorie non trouvée)
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
 *                   example: "Aucune donnée valide fournie pour la mise à jour"
 *       404:
 *         description: Produit non trouvé
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
 *                   example: "Produit non trouvé"
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
 *                   example: "Erreur interne du serveur"
 */

router.patch(
  "/:id",
  verifyToken,
  verifyAdmin,
  validate({ schema: ValidationId, key: "params" }),
  validate({ schema: createProductShema.partial() }),
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
// ----- ADD Images to product

// Ajouter une ou plusieurs images

router.post(
  "/:id/images",
  verifyToken,
  verifyAdmin,
  uploadDiskMiddleware,
  uploadHandler,
  addProductImages
);

// Remplacer / mettre à jour une image

router.put("/:id/images/:imageId", uploadMemoryStorage, updateProductImage);

// Supprimer une image spécifique
router.delete(
  "/:id/images/:imageId",
  verifyToken,
  verifyAdmin,
  validate({ schema: deleteProductImageSchema, key: "params" }),
  deleteProductImage
);

// variants routes
// router.use("/:productId/variants", createProductSchema, createProductVariant);
export default router;
