"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const uploadMiddleware_1 = require("../middlewares/uploadMiddleware");
const validate_1 = require("../middlewares/validate");
const product_controller_1 = require("../controller/product.controller");
const validation_shema_1 = require("../schema/validation.shema");
const auth_1 = require("../middlewares/auth");
const product_shema_1 = require("../schema/product.shema");
const product_controller_2 = require("../controller/product.controller");
const mathUtils_1 = require("../utils/mathUtils");
const router = (0, express_1.Router)();
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
 *       - Rechercher par nom ou titre
 *       - Filtrer par prix, stock ou promotion
 *       - Filtrer uniquement les produits actifs via `isActive`
 *       - Filtrer selon l'état des variantes via `isNestedActive`
 *       - Gérer les variantes via `mode` (`all`, `with`, `without`)
 *       - Filtrer par type de produit (`HONEY`, `CLOTHING`, `DATES`, `OIL`)
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
 *           minimum: 1
 *           default: 1
 *           example: 1
 *       - name: limit
 *         in: query
 *         required: false
 *         description: Nombre de produits par page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *           example: 10
 *       - name: search
 *         in: query
 *         required: false
 *         description: Texte à rechercher dans le titre ou la description
 *         schema:
 *           type: string
 *           example: "miel lavande"
 *       - name: mode
 *         in: query
 *         required: false
 *         description: Mode des variantes à inclure
 *         schema:
 *           type: string
 *           enum: [all, with, without]
 *           default: all
 *           example: "with"
 *       - name: categorySlug
 *         in: query
 *         required: false
 *         description: Slug de la catégorie pour filtrer les produits
 *         schema:
 *           type: string
 *           example: "miels-artisanaux"
 *       - name: onSale
 *         in: query
 *         required: false
 *         description: Filtrer uniquement les produits en promotion
 *         schema:
 *           type: boolean
 *           example: true
 *       - name: minPrice
 *         in: query
 *         required: false
 *         description: Prix minimum des variantes incluses
 *         schema:
 *           type: number
 *           minimum: 0
 *           example: 10.5
 *       - name: maxPrice
 *         in: query
 *         required: false
 *         description: Prix maximum des variantes incluses
 *         schema:
 *           type: number
 *           minimum: 0
 *           example: 50.0
 *       - name: inStock
 *         in: query
 *         required: false
 *         description: Filtrer uniquement les produits actuellement en stock
 *         schema:
 *           type: boolean
 *           example: true
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
 *         description: >
 *           Filtrer les produits dont les variantes sont actives :
 *           - `true` → retourne les produits ayant au moins une variante active
 *           - `false` → retourne les produits dont toutes les variantes sont inactives
 *         schema:
 *           type: boolean
 *           example: true
 *       - name: productType
 *         in: query
 *         required: false
 *         description: Filtrer par type de produit
 *         schema:
 *           type: string
 *           enum: [HONEY, CLOTHING, DATES, OIL]
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
 *                         example: "4f9c5fb9-e20c-4e0d-94ce-06a60a82ee39"
 *                       categoryId:
 *                         type: string
 *                         example: "f1e1efe0-b6e8-49af-a0b1-bdb979a76faf"
 *                       title:
 *                         type: string
 *                         example: "Miel purifié industriellement"
 *                       subDescription:
 *                         type: string
 *                         nullable: true
 *                         example: "Moins riche en enzymes mais se conserve plus longtemps."
 *                       description:
 *                         type: string
 *                         example: "Miel chauffé et filtré, souvent mélangé pour homogénéiser la texture."
 *                       rating:
 *                         type: number
 *                         example: 0
 *                       isActive:
 *                         type: boolean
 *                         example: true
 *                       image:
 *                         type: string
 *                         example: "https://res.cloudinary.com/dje0moqah/image/upload/v1761413543/products/o8so19uyufv8wofrgz1q.jpg"
 *                       variantId:
 *                         type: string
 *                         example: "f0d3bd83-d8dc-4842-9c58-50b05134424e"
 *                       price:
 *                         type: number
 *                         example: 60
 *                       discountPrice:
 *                         type: number
 *                         example: 0
 *                       discountPercentage:
 *                         type: number
 *                         example: 0
 *                       amount:
 *                         type: number
 *                         example: 500
 *                       unit:
 *                         type: string
 *                         example: "g"
 *                       stock:
 *                         type: integer
 *                         example: 100
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                         example: "2025-10-25T17:32:23.266Z"
 *                       updatedAt:
 *                         type: string
 *                         format: date-time
 *                         example: "2025-10-25T17:34:08.346Z"
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                       example: 120
 *                       description: Nombre total de produits
 *                     len:
 *                       type: integer
 *                       example: 10
 *                       description: Nombre de produits dans cette page
 *                     page:
 *                       type: integer
 *                       example: 1
 *                       description: Page actuelle
 *                     limit:
 *                       type: integer
 *                       example: 10
 *                       description: Limite par page
 *                     lastPage:
 *                       type: integer
 *                       example: 12
 *                       description: Dernière page disponible
 *       400:
 *         description: Paramètres de requête invalides
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
 *                   example: "Paramètres de pagination invalides"
 *                 errors:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       field:
 *                         type: string
 *                         example: "page"
 *                       message:
 *                         type: string
 *                         example: "La page doit être un nombre entier positif"
 *       500:
 *         description: Erreur serveur interne
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
router.get("/", (0, validate_1.validate)({
    schema: product_shema_1.QueryProductSchema.merge(validation_shema_1.categorySlug),
    key: "query",
    skipSave: true,
}), product_controller_1.getProducts);
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
router.get("/:id", (0, validate_1.validate)({ schema: validation_shema_1.ValidationId, key: "params" }), product_controller_1.getProductById);
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
router.post("/", auth_1.verifyToken, auth_1.verifyAdmin, uploadMiddleware_1.uploadDiskMiddleware, uploadMiddleware_1.uploadHandler, (0, validate_1.validate)({ schema: product_shema_1.createProductShema, key: "body" }), product_controller_1.createProduct);
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
router.patch("/:id", auth_1.verifyToken, auth_1.verifyAdmin, uploadMiddleware_1.uploadDiskMiddleware, (0, validate_1.validate)({ schema: validation_shema_1.ValidationId, key: "params" }), (0, validate_1.validate)({ schema: product_shema_1.createProductShema.partial(), skipSave: true }), product_controller_1.updateProduct);
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
router.delete("/:id", auth_1.verifyToken, auth_1.verifyAdmin, (0, validate_1.validate)({ schema: product_shema_1.createProductShema.partial() }), product_controller_1.deleteProduct);
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
router.post("/:id/images", auth_1.verifyToken, auth_1.verifyAdmin, uploadMiddleware_1.uploadDiskMiddleware, uploadMiddleware_1.uploadHandler, (0, validate_1.validate)({ schema: validation_shema_1.ValidationId, key: "params" }), product_controller_1.addProductImages);
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
router.put("/:id/images/:imageId", auth_1.verifyToken, auth_1.verifyAdmin, uploadMiddleware_1.uploadMemoryStorage, (0, validate_1.validate)({ schema: product_shema_1.productImageSchema, key: "params" }), uploadMiddleware_1.uploadHandler, product_controller_1.updateProductImage);
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
router.delete("/:id/images/:imageId", auth_1.verifyToken, auth_1.verifyAdmin, (0, validate_1.validate)({ schema: product_shema_1.productImageSchema, key: "params" }), product_controller_1.deleteProductImage);
// -------------------- ADD Variants to product
/**
 * @swagger
 * tags:
 *   - name: Variantes de Produits
 *     description: Gestion des variantes de produits (création, mise à jour, suppression, affichage)
 */
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
router.post("/:id/variants", auth_1.verifyToken, auth_1.verifyAdmin, (0, validate_1.validate)({ schema: validation_shema_1.ValidationId, key: "params" }), (0, validate_1.validate)({
    schema: product_shema_1.createProductVariantSchema.transform(mathUtils_1.calculateDiscountForVariant),
    skipSave: true,
}), validate_1.checkEmptyRequestBody, product_controller_2.createProductVariant);
/**
 * @swagger
 * /products/{id}/variants/{variantId}:
 *   patch:
 *     summary: Mettre à jour une variante de produit
 *     description: Cette route permet de mettre à jour une variante existante d'un produit.
 *     tags:
 *       - Variantes de Produits
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: L'identifiant du produit auquel la variante appartient
 *       - in: path
 *         name: variantId
 *         schema:
 *           type: string
 *         required: true
 *         description: L'identifiant de la variante à mettre à jour
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               amount:
 *                 type: number
 *                 example: 1000
 *               unit:
 *                 type: string
 *                 example: "ml"
 *               price:
 *                 type: number
 *                 example: 29.99
 *               discountPercentage:
 *                 type: number
 *                 example: 15
 *               discountPrice:
 *                 type: number
 *                 example: 24.99
 *               isOnSale:
 *                 type: boolean
 *                 example: false
 *               stock:
 *                 type: number
 *                 example: 100
 *     responses:
 *       200:
 *         description: Variante mise à jour avec succès
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
 *                   example: La variante a été mise à jour avec succès
 *                 data:
 *                   $ref: '#/components/schemas/ProductVariant'
 *       400:
 *         description: Aucune donnée valide fournie pour la mise à jour
 *       404:
 *         description: Produit ou variante non trouvée
 *       409:
 *         description: Conflit - amount déjà utilisé pour une autre variante
 *       500:
 *         description: Erreur interne du serveur
 */
router.patch("/:id/variants/:variantId", auth_1.verifyToken, auth_1.verifyAdmin, (0, validate_1.validate)({ schema: product_shema_1.productVariantSchema, key: "params" }), (0, validate_1.validate)({
    schema: product_shema_1.updateeProductVariantSchema.transform(mathUtils_1.calculateDiscountForVariant),
    skipSave: true,
}), validate_1.checkEmptyRequestBody, product_controller_1.updateProductVariant);
/**
 * @swagger
 * /products/{id}/variants/{variantId}:
 *   delete:
 *     summary: Supprimer une variante de produit
 *     description: >
 *       Supprime une variante spécifique d'un produit.
 *       Vérifie que la variante appartient bien au produit avant suppression.
 *     tags:
 *       - Variantes de Produits
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: L'identifiant du produit
 *       - in: path
 *         name: variantId
 *         required: true
 *         schema:
 *           type: string
 *         description: L'identifiant de la variante à supprimer
 *     responses:
 *       200:
 *         description: Variante supprimée avec succès
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
 *                   example: "La variante a été supprimée avec succès"
 *       404:
 *         description: Produit ou variante introuvable / Produit et variante ne correspondent pas
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
 *                   example: "Produit ou variant ne correspond pas au produit"
 *       500:
 *         description: Erreur serveur
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
 *                   example: "Erreur serveur"
 */
router.delete("/:id/variants/:variantId", auth_1.verifyToken, auth_1.verifyAdmin, (0, validate_1.validate)({ schema: product_shema_1.productVariantSchema, key: "params" }), product_controller_1.deleteProductVariant);
exports.default = router;
console.log("🔒 product routes loaded");
//# sourceMappingURL=product.routes.js.map