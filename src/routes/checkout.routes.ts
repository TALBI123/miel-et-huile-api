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
 *       ⚠️ **Authentification requise** : Token JWT valide dans l'en-tête Authorization.
 *       
 *       **Champs obligatoires :**
 *       - `items` : Tableau d'articles du panier (minimum 1 article)
 *       - `shippingAddress` : Adresse de livraison complète
 *       - `shippingCost` : Coût de livraison calculé
 *       
 *       **Champs optionnels :**
 *       - `shippingOption` : Type de livraison (défaut: "auto")
 *     tags:
 *       - Paiement
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - items
 *               - shippingAddress
 *               - shippingCost
 *             properties:
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
 *                       example: "42b6302b-4e6d-45d0-9f79-c2865465b720"
 *                     variantId:
 *                       type: string
 *                       format: uuid
 *                       description: Identifiant de la variante du produit
 *                       example: "577e8b2b-1c13-46f7-8c04-9f4b95410b2a"
 *                     quantity:
 *                       type: integer
 *                       minimum: 1
 *                       description: Quantité du produit à commander
 *                       example: 3
 *               shippingAddress:
 *                 type: object
 *                 required:
 *                   - firstName
 *                   - lastName
 *                   - email
 *                   - phone
 *                   - address
 *                   - city
 *                   - postalCode
 *                   - country
 *                 properties:
 *                   firstName:
 *                     type: string
 *                     description: Prénom du destinataire
 *                     example: "Jean"
 *                   lastName:
 *                     type: string
 *                     description: Nom de famille du destinataire
 *                     example: "Dupont"
 *                   email:
 *                     type: string
 *                     format: email
 *                     description: Adresse email du destinataire
 *                     example: "jean.dupont@example.com"
 *                   phone:
 *                     type: string
 *                     description: Numéro de téléphone
 *                     example: "+33123456789"
 *                   address:
 *                     type: string
 *                     description: Adresse complète (rue, numéro)
 *                     example: "123 Rue de la Paix"
 *                   city:
 *                     type: string
 *                     description: Ville
 *                     example: "Paris"
 *                   postalCode:
 *                     type: string
 *                     description: Code postal
 *                     example: "75001"
 *                   country:
 *                     type: string
 *                     description: Code pays (ISO 3166-1 alpha-2)
 *                     example: "FR"
 *                   complement:
 *                     type: string
 *                     description: Complément d'adresse (optionnel)
 *                     example: "Appartement 3B"
 *                   company:
 *                     type: string
 *                     description: Nom de l'entreprise (optionnel)
 *                     example: "ACME Corp"
 *               shippingOption:
 *                 type: string
 *                 enum: ["auto", "packlink", "zone"]
 *                 default: "auto"
 *                 description: >
 *                   Type d'expédition :
 *                   - `auto` : Sélection automatique du meilleur transporteur
 *                   - `packlink` : Utilise l'API Packlink pour l'expédition
 *                   - `zone` : Livraison par zone géographique
 *                 example: "packlink"
 *               shippingCost:
 *                 type: number
 *                 format: float
 *                 minimum: 0
 *                 description: Coût de livraison en euros (calculé au préalable)
 *                 example: 12.50
 *           example:
 *             items:
 *               - productId: "42b6302b-4e6d-45d0-9f79-c2865465b720"
 *                 variantId: "577e8b2b-1c13-46f7-8c04-9f4b95410b2a"
 *                 quantity: 2
 *               - productId: "33a5201a-3c5c-34c0-8e68-b1754354a619"
 *                 variantId: "466d7a1a-0b02-35e6-7b93-8e3a84399a1b"
 *                 quantity: 1
 *             shippingAddress:
 *               firstName: "Jean"
 *               lastName: "Dupont"
 *               email: "jean.dupont@example.com"
 *               phone: "+33123456789"
 *               address: "123 Rue de la Paix"
 *               city: "Paris"
 *               postalCode: "75001"
 *               country: "FR"
 *               complement: "Appartement 3B"
 *             shippingOption: "packlink"
 *             shippingCost: 12.50
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
 *                   example: "Commande créée avec succès"
 *                 id:
 *                   type: string
 *                   description: ID de la session Stripe Checkout
 *                   example: "cs_test_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9"
 *                 orderId:
 *                   type: string
 *                   format: uuid
 *                   description: ID de la commande créée
 *                   example: "ord_12345678-1234-1234-1234-123456789012"
 *       400:
 *         description: Données de requête invalides
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
 *                   example: "Données de validation échouées"
 *                 errors:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       field:
 *                         type: string
 *                         example: "items"
 *                       message:
 *                         type: string
 *                         example: "Le panier doit contenir au moins un article"
 *       401:
 *         description: Token d'authentification manquant ou invalide
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
 *                   example: "Token d'authentification requis"
 *       404:
 *         description: Produit ou variante non trouvé
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
 *                   example: "Produit ou variante non trouvé"
 *       409:
 *         description: Stock insuffisant
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
 *                   example: "Stock insuffisant pour le produit demandé"
 *       500:
 *         description: Erreur serveur lors de la création de la session Stripe
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
 *                   example: "Erreur lors de la création de la session de paiement"
 *                 error:
 *                   type: string
 *                   example: "Impossible de créer la session Stripe"
 */

router.post(
  "/",
  verifyToken,
  validate({ schema: CheckoutSchema, skipSave: true }),
  checkItemsArray,
  createCheckoutSession
);
export default router;