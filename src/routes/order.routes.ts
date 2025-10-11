import { queryOrderSchema, ValidationId } from "../schema/validation.shema";
import { verifyAdmin, verifyToken } from "../middlewares/auth";
import { validate } from "../middlewares/validate";
import {
  cancelOrder,
  getOrderById,
  getOrders,
} from "../controller/order.controller";
import { Router } from "express";
const router = Router();
/**
 * @swagger
 * tags:
 *   - name: Orders
 *     description: >
 *       Gestion complète des commandes clients dans le système e-commerce.
 *       ⚠️ Certains endpoints nécessitent une authentification (token JWT) et un rôle administrateur.
 */

/**
 * @swagger
 * /orders:
 *   get:
 *     summary: Récupère les commandes avec filtres avancés
 *     description: >
 *       Permet de récupérer les commandes selon différents critères :
 *       statut, statut de paiement, prix min/max, recherche, date, disponibilité, etc.
 *       ### Statuts possibles :
 *       - `CONFIRMED` → Commande confirmée par le client
 *       - `PROCESSING` → En cours de traitement
 *       - `PENDING` → En attente de confirmation ou paiement
 *       - `FAILED` → Échec du paiement ou de la création
 *       - `SHIPPED` → Commande expédiée
 *       - `REFUNDED` → Commande remboursée
 *       - `DELIVERED` → Commande livrée au client
 *       - `CANCELLED` → Commande annulée par le client ou l’administrateur
 *       Ce module permet :
 *       - 🔍 La recherche et le filtrage des commandes selon plusieurs critères (statut, paiement, prix, date, etc.)
 *       - 📄 La consultation des détails d'une commande spécifique
 *       - 🧾 Le suivi de l’état de chaque commande (`PENDING`, `PROCESSING`, `SHIPPED`, `DELIVERED`, etc.)
 *       - 💳 Le suivi du statut de paiement (`paid`, `unpaid`)
 *       - ⚙️ L’administration des commandes pour les administrateurs (mise à jour, suppression)
 *       - ⏱️ L’ajout du champ `timeAgo` pour afficher le temps écoulé depuis la création d’une commande
 *     tags:
 *       - Orders
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Recherche par nom de client, email, ou identifiant de commande.
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [CONFIRMED, PROCESSING, PENDING, FAILED, SHIPPED, REFUNDED, DELIVERED, CANCELLED]
 *         description: Statut de la commande.
 *       - in: query
 *         name: paymentStatus
 *         schema:
 *           type: string
 *           enum: [paid, unpaid]
 *         description: Statut du paiement.
 *       - in: query
 *         name: minPrice
 *         schema:
 *           type: number
 *         description: Montant minimum total de la commande.
 *       - in: query
 *         name: maxPrice
 *         schema:
 *           type: number
 *         description: Montant maximum total de la commande.
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filtrer les commandes créées après cette date.
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filtrer les commandes créées avant cette date.
 *       - in: query
 *         name: inStock
 *         schema:
 *           type: boolean
 *         description: Filtrer uniquement les commandes dont les produits sont encore en stock.
 *       - in: query
 *         name: isOnSale
 *         schema:
 *           type: boolean
 *         description: Filtrer uniquement les commandes dont les produits sont en promotion.
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page actuelle pour la pagination.
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 5
 *         description: Nombre d’éléments par page.
 *     responses:
 *       200:
 *         description: Liste paginée des commandes avec le champ `timeAgo` ajouté.
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
 *                       totalAmount:
 *                         type: number
 *                       status:
 *                         type: string
 *                       paymentStatus:
 *                         type: string
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                       timeAgo:
 *                         type: string
 *                         example: "2 hours ago"
 *                 total:
 *                   type: integer
 *                   example: 42
 *                 len:
 *                   type: integer
 *                   example: 5
 *                 lastPage:
 *                   type: integer
 *                   example: 9
 *       404:
 *         description: Aucune commande trouvée.
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
 *                   example: "Aucune commande trouvée"
 *       500:
 *         description: Erreur serveur interne.
 */

router.get(
  "/",
  verifyToken,
  verifyAdmin,
  validate({ schema: queryOrderSchema, skipSave: true, key: "query" }),
  getOrders
); // toutes les commandes de l’utilisateur
router.get(
  "/:id",
  verifyToken,
  verifyAdmin,
  validate({ schema: ValidationId }),
  getOrderById
); // détail d’une commande
router.put(
  "/:id/cancel",
  verifyToken,
  verifyAdmin,
  validate({ schema: ValidationId }),
  cancelOrder
); // annuler une commande
export default router;
