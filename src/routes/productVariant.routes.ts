import { getProductTypeMiddleware } from "../middlewares/product.middleware";
import { calculateDiscountForVariant } from "../utils/mathUtils";
import { checkEmptyRequestBody } from "../middlewares/validate";
import { verifyAdmin, verifyToken } from "../middlewares/auth";
import { ValidationId } from "../schema/validation.shema";
import { validate } from "../middlewares/validate";
import {
  createProductVariant,
  deleteProductVariant,
  updateProductVariant,
} from "../controller/productVariant.controller";
import {
  createProductVariantSchema,
  productVariantSchema,
  updateeProductVariantSchema,
} from "../schema/product.shema";
import { Router } from "express";
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
 *     summary: Créer une nouvelle variante pour un produit
 *     description: |
 *       Cette route permet de créer une variante pour un produit existant.
 *       - Le `productType` est récupéré via un middleware.
 *       - Pour les produits **HONNEY** ou **DATTES**, les champs `amount` et `unit` sont nécessaires.
 *       - Pour les produits **CLOTHING**, seul le champ `size` est utilisé à la place de `amount` et `unit`.
 *     tags:
 *       - Variantes de Produits
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: L'identifiant du produit
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               price:
 *                 type: number
 *                 example: 29.99
 *               discountPrice:
 *                 type: number
 *                 example: 24.99
 *                 description: Utilisé si discountPercentage n'est pas fourni
 *               discountPercentage:
 *                 type: number
 *                 example: 15
 *                 description: Utilisé si discountPrice n'est pas fourni
 *               isOnSale:
 *                 type: boolean
 *                 example: false
 *               stock:
 *                 type: integer
 *                 example: 100
 *               amount:
 *                 type: number
 *                 example: 500
 *                 description: Non utilisé pour CLOTHING
 *               unit:
 *                 type: string
 *                 example: "g"
 *                 description: Non utilisé pour CLOTHING
 *               size:
 *                 type: string
 *                 example: "M"
 *                 description: Utilisé uniquement pour CLOTHING
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
 *                 message:
 *                   type: string
 *                   example: "Variante créée avec succès"
 *                 data:
 *                   type: object
 *                   properties:
 *                     price:
 *                       type: number
 *                       example: 29.99
 *                     discountPrice:
 *                       type: number
 *                       example: 24.99
 *                     discountPercentage:
 *                       type: number
 *                       example: 15
 *                     isOnSale:
 *                       type: boolean
 *                       example: false
 *                     stock:
 *                       type: integer
 *                       example: 100
 *                     amount:
 *                       type: number
 *                       example: 500
 *                     unit:
 *                       type: string
 *                       example: "g"
 *                     size:
 *                       type: string
 *                       example: "M"
 *       400:
 *         description: Données invalides ou manquantes
 *       404:
 *         description: Produit non trouvé
 *       409:
 *         description: Conflit - amount ou size déjà utilisé pour une autre variante
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
  getProductTypeMiddleware,
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
 *     description: |
 *       Cette route permet de mettre à jour une variante existante d'un produit.
 *       Le `productType` est récupéré via un middleware en fonction de l'id du produit.
 *       - **HONEY ou DATES** : les champs `amount` et `unit` sont utilisés.
 *       - **CLOTHING** : seul le champ `size` est utilisé à la place de `amount` et `unit`.
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
 *               price:
 *                 type: number
 *                 example: 29.99
 *               discountPrice:
 *                 type: number
 *                 example: 24.99
 *                 description: Utilisé si discountPercentage n'est pas fourni
 *               discountPercentage:
 *                 type: number
 *                 example: 15
 *                 description: Utilisé si discountPrice n'est pas fourni
 *               isActive:
 *                 type: boolean
 *                 example: true
 *               stock:
 *                 type: integer
 *                 example: 100
 *               amount:
 *                 type: number
 *                 example: 500
 *                 description: Non utilisé pour CLOTHING
 *               unit:
 *                 type: string
 *                 example: "g"
 *                 description: Non utilisé pour CLOTHING
 *               size:
 *                 type: string
 *                 example: "M"
 *                 description: Utilisé uniquement pour CLOTHING
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
 *                   type: object
 *                   properties:
 *                     price:
 *                       type: number
 *                       example: 29.99
 *                     discountPrice:
 *                       type: number
 *                       example: 24.99
 *                     discountPercentage:
 *                       type: number
 *                       example: 15
 *                     isActive:
 *                       type: boolean
 *                       example: true
 *                     stock:
 *                       type: integer
 *                       example: 100
 *                     amount:
 *                       type: number
 *                       example: 500
 *                     unit:
 *                       type: string
 *                       example: "g"
 *                     size:
 *                       type: string
 *                       example: "M"
 *       400:
 *         description: Aucune donnée valide fournie pour la mise à jour
 *       404:
 *         description: Produit ou variante non trouvée
 *       409:
 *         description: Conflit - amount ou size déjà utilisé pour une autre variante
 *       500:
 *         description: Erreur interne du serveur
 */

router.patch(
  "/:variantId",
  verifyToken,
  verifyAdmin,
  validate({ schema: productVariantSchema, key: "params" }),
  getProductTypeMiddleware,
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