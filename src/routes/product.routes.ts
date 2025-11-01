import { checkEmptyRequestBody, validate } from "../middlewares/validate";
import { categorySlug, ValidationId } from "../schema/validation.shema";
import { verifyAdmin, verifyToken } from "../middlewares/auth";
import productVariantRoute from "./productVariant.routes";
import productImagesRoute from "./productImages.routes";
import reviewsRoute from "./review.routes";
import {
  uploadDiskMiddleware,
  uploadHandler,
} from "../middlewares/uploadMiddleware";
import {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
} from "../controller/product.controller";
import {
  createProductShema,
  QueryProductSchema,
} from "../schema/product.shema";
import { Router } from "express";
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
 *     summary: Récupérer les produits avec filtres, pagination et catégorie
 *     description: >
 *       Cette route permet de récupérer les produits avec la possibilité de :
 *       - Filtrer par `categorySlug` (slug de catégorie)
 *       - Rechercher par nom ou description via `search`
 *       - Filtrer par prix (`minPrice` et `maxPrice`) et stock
 *       - Filtrer uniquement les produits actifs via `isActive`
 *       - Filtrer selon l'état des variantes via `isNestedActive` (avec startDate et endDate)
 *       - Gérer les variantes via `mode` (`all`, `with`, `without`)
 *       - Filtrer par type de produit (`HONEY`, `CLOTHING`, `DATES`)
 *       - Combiner plusieurs filtres sans générer d'erreur
 *
 *       La variante la moins chère est automatiquement incluse dans le retour.
 *     tags:
 *       - Produits
 *     parameters:
 *       - name: page
 *         in: query
 *         required: false
 *         description: Numéro de page pour la pagination
 *         schema:
 *           type: integer
 *           example: 1
 *       - name: limit
 *         in: query
 *         required: false
 *         description: Nombre de résultats par page
 *         schema:
 *           type: integer
 *           example: 10
 *       - name: search
 *         in: query
 *         required: false
 *         description: Recherche par nom ou description de produit
 *         schema:
 *           type: string
 *           example: "Miel"
 *       - name: mode
 *         in: query
 *         required: false
 *         description: Filtrage selon le contenu des catégories
 *         schema:
 *           type: string
 *           enum: [all, with, without]
 *           example: "all"
 *       - name: isActive
 *         in: query
 *         required: false
 *         description: Filtrer uniquement les produits actifs
 *         schema:
 *           type: boolean
 *           example: true
 *       - name: isNestedActive
 *         in: query
 *         required: false
 *         description: Filtrer les produits dont les variantes sont actives (en fonction de startDate et endDate)
 *         schema:
 *           type: boolean
 *           example: true
 *       - name: minPrice
 *         in: query
 *         required: false
 *         description: Prix minimum pour filtrer
 *         schema:
 *           type: number
 *           example: 10
 *       - name: maxPrice
 *         in: query
 *         required: false
 *         description: Prix maximum pour filtrer
 *         schema:
 *           type: number
 *           example: 100
 *       - name: productType
 *         in: query
 *         required: false
 *         description: Filtrer par type de produit
 *         schema:
 *           type: string
 *           enum: [HONEY, CLOTHING, DATES]
 *           example: "HONEY"
 *     responses:
 *       200:
 *         description: Succès, renvoie la liste des produits filtrés
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
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       categoryId:
 *                         type: string
 *                       title:
 *                         type: string
 *                       subDescription:
 *                         type: string
 *                         nullable: true
 *                       description:
 *                         type: string
 *                       rating:
 *                         type: number
 *                       isActive:
 *                         type: boolean
 *                       image:
 *                         type: string
 *                       variantId:
 *                         type: string
 *                       price:
 *                         type: number
 *                       discountPrice:
 *                         type: number
 *                       discountPercentage:
 *                         type: number
 *                       amount:
 *                         type: number
 *                       unit:
 *                         type: string
 *                       stock:
 *                         type: integer
 *                       productType:
 *                         type: string
 *                         enum: [HONEY, CLOTHING, DATES]
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                       updatedAt:
 *                         type: string
 *                         format: date-time
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                     len:
 *                       type: integer
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     lastPage:
 *                       type: integer
 *       400:
 *         description: Paramètres de requête invalides
 *       500:
 *         description: Erreur serveur interne
 */

router.get(
  "/",
  validate({
    schema: QueryProductSchema.merge(categorySlug),
    key: "query",
    skipSave: true,
  }),
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
 *       
 *       **Paramètres supplémentaires :**
 *       - `origin` : Origine du produit (ex: "Maroc", "France"). Champ optionnel.
 *       - `productType` : Type de produit, valeurs possibles : 
 *         - `HONEY` : Miel
 *         - `CLOTHING` : Vêtements
 *         - `DATES` : Dattes
 *         - Valeur par défaut : `HONEY`
 *         
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
 *               origin:
 *                 type: string
 *                 description: "Origine du produit (ex: Maroc, France). Optionnel."
 *                 example: "Maroc"
 *               productType:
 *                 type: string
 *                 description: "Type de produit. Valeurs possibles : HONEY (Miel), CLOTHING (Vêtements), DATES (Dattes). Défaut : HONEY"
 *                 enum:
 *                   - HONEY
 *                   - CLOTHING
 *                   - DATES
 *                 example: "HONEY"
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
 *                     origin:
 *                       type: string
 *                       example: "Maroc"
 *                     productType:
 *                       type: string
 *                       example: "HONEY"
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
  uploadHandler,
  validate({ schema: createProductShema }),
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
 *               origin:
 *                 type: string
 *                 example: "Maroc"
 *                 description: "Origine du produit"
 *               productType:
 *                 type: string
 *                 enum: [HONEY, CLOTHING, DATES]
 *                 example: "CLOTHING"
 *                 description: "Type du produit"
 *               isActive:
 *                 type: boolean
 *                 example: true
 *                 description: "Indique si le produit est actif"
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
 *                     origin:
 *                       type: string
 *                       example: "Maroc"
 *                     productType:
 *                       type: string
 *                       enum: [HONEY, CLOTHING, DATES]
 *                       example: "CLOTHING"
 *                     isActive:
 *                       type: boolean
 *                       example: true
 *       400:
 *         description: Requête invalide (aucune donnée valide ou catégorie non trouvée)
 *       404:
 *         description: Produit non trouvé
 *       500:
 *         description: Erreur interne du serveur
 */

router.patch(
  "/:id",
  verifyToken,
  verifyAdmin,
  uploadDiskMiddleware,
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
  validate({ schema: createProductShema.partial() }),
  deleteProduct
);

// === ROUTES VARIANTS IMBRIQUÉES ===
// Toutes les routes variants seront préfixées par /products/:id/variants
router.use("/:id/variants", productVariantRoute);

// === ROUTES IMAGES IMBRIQUÉES ===
// Toutes les routes images seront préfixées par /products/:id/images
router.use("/:id/images", productImagesRoute);

// === ROUTES REVIEWS IMBRIQUÉES ===
// Toutes les routes reviews seront préfixées par /products/:id/reviews
router.use("/:id/reviews", reviewsRoute);

export default router;
console.log("🔒 product routes loaded");
