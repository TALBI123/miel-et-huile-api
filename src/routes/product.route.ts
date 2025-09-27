import { Router } from "express";
import {
  uploadDiskMiddleware,
  uploadHandler,
  uploadMemoryStorage,
} from "../middlewares/uploadMiddleware";
import { checkEmptyRequestBody, validate } from "../middlewares/validate";
import {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  addProductImages,
  deleteProductImage,
  updateProductImage,
  updateProductVariant,
} from "../controller/product.controller";
import { QuerySchema, ValidationId } from "../schema/validation.shema";
import { verifyAdmin, verifyToken } from "../middlewares/auth";
import {
  createProductShema,
  createProductVariantSchema,
  productImageSchema,
  productVariantImageSchema,
} from "../schema/product.shema";
import { createProductVariant } from "../controller/product.controller";
import { calculateDiscountForVariant } from "../utils/mathUtils";
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
// -------------------- ADD Images to product

// Ajouter une ou plusieurs images
/**
 * @swagger
 * /products/{id}/images:
 *   post:
 *     summary: Ajouter des images à un produit
 *     description: >
 *       Ajoute une ou plusieurs images à un produit existant.
 *       - Maximum **4 images par produit**.
 *       - Si la limite est atteinte, une erreur est retournée.
 *     tags:
 *       - Produits
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID du produit
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               files:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: Liste des images à uploader
 *     responses:
 *       201:
 *         description: Images ajoutées avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Images ajoutées avec succès
 *       400:
 *         description: Trop d'images ou mauvaise requête
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Le nombre maximum d'images (4) pour ce produit est déjà atteint
 *       404:
 *         description: Produit non trouvé
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Produit non trouvé
 *       500:
 *         description: Erreur serveur
 */

router.post(
  "/:id/images",
  verifyToken,
  verifyAdmin,
  uploadDiskMiddleware,
  uploadHandler,
  validate({ schema: ValidationId, key: "params" }),
  addProductImages
);

// Remplacer / mettre à jour une image
/**
 * @swagger
 * /products/{id}/images/{imageId}:
 *   put:
 *     summary: Mettre à jour une image d'un produit
 *     description: >
 *       Remplace une image existante d’un produit par une nouvelle.
 *       - Upload sur Cloudinary
 *       - Mise à jour en base
 *       - Suppression de l’ancienne image
 *     tags:
 *       - Produits
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID du produit
 *       - in: path
 *         name: imageId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de l'image à mettre à jour
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: Nouvelle image à uploader
 *             required:
 *               - file
 *     responses:
 *       200:
 *         description: Image mise à jour avec succès
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
 *                   example: Image mise à jour avec succès
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       example: img_123
 *                     publicId:
 *                       type: string
 *                       example: products/abc123
 *                     image:
 *                       type: string
 *                       example: https://res.cloudinary.com/demo/image/upload/v1690000000/products/abc123.jpg
 *       404:
 *         description: Produit ou image introuvable
 *       500:
 *         description: Erreur serveur
 */

router.put(
  "/:id/images/:imageId",
  verifyToken,
  verifyAdmin,
  uploadMemoryStorage,
  validate({ schema: productImageSchema, key: "params" }),
  uploadHandler,
  updateProductImage
);
/**
 * @swagger
 * /products/{id}/images/{imageId}:
 *   delete:
 *     summary: Supprimer une image d'un produit
 *     description: >
 *       Supprime une image associée à un produit donné.
 *       - Supprime l’entrée en base de données
 *       - Supprime également l’image sur Cloudinary (si elle existe)
 *     tags:
 *       - Produits
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID du produit
 *       - in: path
 *         name: imageId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de l'image associée au produit
 *     responses:
 *       200:
 *         description: Image supprimée avec succès
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
 *                   example: l'image a été supprimée avec succès
 *       404:
 *         description: Produit ou image introuvable
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
 *                   example: Image non trouvée pour ce produit
 *       500:
 *         description: Erreur serveur
 */

// Supprimer une image spécifique
router.delete(
  "/:id/images/:imageId",
  verifyToken,
  verifyAdmin,
  validate({ schema: productImageSchema, key: "params" }),
  deleteProductImage
);

// -------------------- ADD Variants to product
/**
 * @swagger
 * /products/{id}/variants:
 *   post:
 *     summary: Créer une variante de produit
 *     description: |
 *       Cette route permet d'ajouter une nouvelle variante à un produit existant.
 *       Une variante représente une configuration spécifique (par ex. quantité, unité, prix, etc.).
 *     tags:
 *       - Variantes de Produits
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: L'identifiant du produit auquel la variante sera associée
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               amount:
 *                 type: number
 *                 example: 500
 *                 description: Quantité de la variante
 *               unit:
 *                 type: string
 *                 example: "g"
 *                 description: Unité de mesure de la variante
 *               price:
 *                 type: number
 *                 example: 19.99
 *                 description: Prix normal de la variante
 *               discountPercentage:
 *                 type: number
 *                 example: 10
 *                 description: Pourcentage de réduction (optionnel)
 *               discountPrice:
 *                 type: number
 *                 example: 17.99
 *                 description: Prix réduit si en promotion (optionnel)
 *               isOnSale:
 *                 type: boolean
 *                 example: true
 *                 description: Indique si la variante est en promotion
 *               stock:
 *                 type: number
 *                 example: 50
 *                 description: Quantité en stock disponible
 *     responses:
 *       201:
 *         description: Variante créée avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/ProductVariant'
 *       404:
 *         description: Produit non trouvé
 *       500:
 *         description: Erreur interne du serveur
 */
/**
 * @swagger
 * components:
 *   schemas:
 *     ProductVariant:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           example: "var_123"
 *         productId:
 *           type: string
 *           example: "prod_456"
 *         amount:
 *           type: number
 *           example: 500
 *         unit:
 *           type: string
 *           example: "g"
 *         price:
 *           type: number
 *           example: 19.99
 *         discountPercentage:
 *           type: number
 *           example: 10
 *         discountPrice:
 *           type: number
 *           example: 17.99
 *         isOnSale:
 *           type: boolean
 *           example: true
 *         stock:
 *           type: number
 *           example: 50
 */

router.post(
  "/:id/variants",
  verifyToken,
  verifyAdmin,
  validate({ schema: ValidationId, key: "params" }),
  validate({
    schema: createProductVariantSchema.transform(calculateDiscountForVariant),
    skipSave: true,
  }),
  checkEmptyRequestBody,
  createProductVariant
);

router.patch(
  "/:id/variants/:variantId",
  verifyToken,
  verifyAdmin,
  validate({ schema: productVariantImageSchema, key: "params" }),
  validate({
    schema: createProductVariantSchema
      .partial()
      .transform(calculateDiscountForVariant),
    skipSave: true,
  }),
  checkEmptyRequestBody,
  updateProductVariant
);

export default router;
console.log("🔒 product routes loaded");