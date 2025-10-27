import {
  addProductImages,
  deleteProductImage,
  updateProductImage,
} from "../controller/productImages.controller";
// import { deleteProductImage } from "../controller/product.controller";
import { verifyAdmin, verifyToken } from "../middlewares/auth";
import { productImageSchema } from "../schema/product.shema";
import { Router } from "express";
import {
  uploadDiskMiddleware,
  uploadHandler,
  uploadMemoryStorage,
} from "../middlewares/uploadMiddleware";
// import {
//   uploadDiskMiddleware,
//   uploadHandler,
//   uploadMemoryStorage,
// } from "../middlewares/uploadMiddleware";
import { validate } from "../middlewares/validate";
import { ValidationId } from "../schema/validation.shema";
const router = Router({ mergeParams: true }); // Important pour accéder aux params du parent
// -------------- ADD Images to product

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
  "/images",
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
  "/:imageId",
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
  "/:imageId",
  verifyToken,
  verifyAdmin,
  validate({ schema: productImageSchema, key: "params" }),
  deleteProductImage
);

export default router;