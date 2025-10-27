import { validate } from "../middlewares/validate";
import {
  createProductVariant,
  deleteProductVariant,
  updateProductVariant,
} from "../controller/productVariant.controller";
import { Router } from "express";
import { verifyAdmin, verifyToken } from "../middlewares/auth";
import { checkEmptyRequestBody } from "../middlewares/validate";
import {
  createProductVariantSchema,
  productVariantSchema,
  updateeProductVariantSchema,
} from "../schema/product.shema";
import { ValidationId } from "../schema/validation.shema";
import { calculateDiscountForVariant } from "../utils/mathUtils";
const router = Router({ mergeParams: true }); // Important pour accéder aux params du parent
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

router.post(
  "/",
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

router.patch(
  "/:variantId",
  verifyToken,
  verifyAdmin,
  validate({ schema: productVariantSchema, key: "params" }),
  validate({
    schema: updateeProductVariantSchema.transform(calculateDiscountForVariant),
    skipSave: true,
  }),
  checkEmptyRequestBody,
  updateProductVariant
);
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

router.delete(
  "/:variantId",
  verifyToken,
  verifyAdmin,
  validate({ schema: productVariantSchema, key: "params" }),
  deleteProductVariant
);
export default router;