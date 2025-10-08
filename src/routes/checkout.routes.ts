import { createCheckoutSession } from "../controller/checkout.controller";
import { checkItemsArray  } from "../middlewares/checkItemsArray ";
import { CheckoutSchema } from "../schema/checkout.schema";
import { validate } from "../middlewares/validate";
import { verifyToken } from "../middlewares/auth";
import { Router } from "express";
const router = Router();
/**
 * @swagger
 * tags:
 *   - name: Paiement
 *     description: Gestion du processus de paiement avec Stripe
 */

/**
 * @swagger
 * /checkout:
 *   post:
 *     summary: Créer une session de paiement Stripe
 *     description: >
 *       Ce endpoint permet de créer une nouvelle commande et de générer une **session Stripe Checkout**.
 *       Le frontend utilisera l'`id` de session retourné pour rediriger l'utilisateur vers la page de paiement Stripe.
 *
 *       ⚠️ Les champs `userId` et `items` sont **obligatoires**.
 *       - `userId` représente l'identifiant unique de l'utilisateur.
 *       - `items` est un tableau contenant les produits du panier avec leur quantité.
 *     tags:
 *       - Paiement
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - items
 *             properties:
 *               userId:
 *                 type: string
 *                 format: uuid
 *                 description: Identifiant unique de l'utilisateur
 *                 example: 8395e8cb-b3b6-45b4-b750-788f10f80c8a
 *               items:
 *                 type: array
 *                 description: Liste des articles du panier
 *                 minItems: 1
 *                 items:
 *                   type: object
 *                   required:
 *                     - productId
 *                     - variantId
 *                     - quantity
 *                   properties:
 *                     productId:
 *                       type: string
 *                       format: uuid
 *                       description: Identifiant du produit
 *                       example: 42b6302b-4e6d-45d0-9f79-c2865465b720
 *                     variantId:
 *                       type: string
 *                       format: uuid
 *                       description: Identifiant de la variante
 *                       example: 577e8b2b-1c13-46f7-8c04-9f4b95410b2a
 *                     quantity:
 *                       type: integer
 *                       description: Quantité du produit
 *                       example: 3
 *     responses:
 *       200:
 *         description: Session Stripe créée avec succès
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
 *                   example: Commande créée avec succès
 *                 id:
 *                   type: string
 *                   example: cs_test_a1b2c3d4e5f6g7
 *       500:
 *         description: Erreur serveur lors de la création de la session Stripe
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Impossible de créer la session Stripe
 */

router.post(
  "/",
    verifyToken,
  validate({ schema: CheckoutSchema, skipSave: true }),
  checkItemsArray,
  createCheckoutSession
);

export default router;
