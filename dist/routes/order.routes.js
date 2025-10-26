"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const validation_shema_1 = require("../schema/validation.shema");
const auth_1 = require("../middlewares/auth");
const validate_1 = require("../middlewares/validate");
const order_controller_1 = require("../controller/order.controller");
const express_1 = require("express");
const router = (0, express_1.Router)();
/**
 * @swagger
 * tags:
 *   - name: Commandes
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
 *       - Commandes
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
router.get("/", auth_1.verifyToken, auth_1.verifyAdmin, (0, validate_1.validate)({ schema: validation_shema_1.queryOrderSchema, skipSave: true, key: "query" }), order_controller_1.getOrders);
/**
 * @swagger
 * /orders/me:
 *   get:
 *     summary: Récupérer les commandes de l'utilisateur connecté
 *     description: >
 *       Cette route permet à un utilisateur authentifié de récupérer ses commandes.
 *
 *       Elle prend en charge plusieurs options :
 *       - **Filtrer par statut** (`status`)
 *       - **Filtrer par prix** (`minPrice`, `maxPrice`)
 *       - **Filtrer par date** (`startDate`, `endDate`)
 *       - **Rechercher par mot-clé** (`search`)
 *       - **Pagination** (`page`, `limit`)
 *
 *       Chaque commande inclut :
 *       - Les informations utilisateur
 *       - Les produits et variantes commandés
 *       - Les montants et statuts
 *     tags:
 *       - Commandes
 *     security:
 *       - cookieAuth: []  # Nécessite un JWT valide (HttpOnly cookie)
 *     parameters:
 *       - $ref: '#/components/parameters/PageParam'
 *       - $ref: '#/components/parameters/LimitParam'
 *       - name: status
 *         in: query
 *         required: false
 *         description: Statut de la commande à filtrer
 *         schema:
 *           type: string
 *           enum:
 *             - CONFIRMED
 *             - PROCESSING
 *             - PENDING
 *             - FAILED
 *             - SHIPPED
 *             - REFUNDED
 *             - DELIVERED
 *             - CANCELLED
 *           example: CONFIRMED
 *       - name: paymentStatus
 *         in: query
 *         required: false
 *         description: Statut du paiement (paid ou unpaid)
 *         schema:
 *           type: string
 *           enum: [paid, unpaid]
 *           example: paid
 *       - name: minPrice
 *         in: query
 *         required: false
 *         description: Filtrer les commandes dont le total est supérieur ou égal à cette valeur
 *         schema:
 *           type: number
 *           example: 50
 *       - name: maxPrice
 *         in: query
 *         required: false
 *         description: Filtrer les commandes dont le total est inférieur ou égal à cette valeur
 *         schema:
 *           type: number
 *           example: 500
 *       - name: startDate
 *         in: query
 *         required: false
 *         description: Date de début du filtre (inclus). Doit être au format ISO.
 *         schema:
 *           type: string
 *           format: date-time
 *           example: "2025-01-01T00:00:00.000Z"
 *       - name: endDate
 *         in: query
 *         required: false
 *         description: Date de fin du filtre (inclus). Doit être au format ISO.
 *         schema:
 *           type: string
 *           format: date-time
 *           example: "2025-12-31T23:59:59.000Z"
 *       - name: search
 *         in: query
 *         required: false
 *         description: Rechercher une commande par mot-clé (nom du produit, description)
 *         schema:
 *           type: string
 *           example: "miel"
 *     responses:
 *       200:
 *         description: Succès — Retourne la liste des commandes filtrées
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
 *                         example: "ord_64f2c5e7b5e7e72f12345678"
 *                       totalAmount:
 *                         type: number
 *                         example: 120.50
 *                       status:
 *                         type: string
 *                         enum:
 *                           - CONFIRMED
 *                           - PROCESSING
 *                           - PENDING
 *                           - FAILED
 *                           - SHIPPED
 *                           - REFUNDED
 *                           - DELIVERED
 *                           - CANCELLED
 *                         example: "CONFIRMED"
 *                       paymentStatus:
 *                         type: string
 *                         enum: [paid, unpaid]
 *                         example: "paid"
 *                       user:
 *                         type: object
 *                         properties:
 *                           firstName:
 *                             type: string
 *                             example: "Mohamed"
 *                           lastName:
 *                             type: string
 *                             example: "Amine"
 *                           email:
 *                             type: string
 *                             example: "amine@example.com"
 *                       items:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             product:
 *                               type: object
 *                               properties:
 *                                 title:
 *                                   type: string
 *                                   example: "Miel d’acacia pur"
 *                                 subDescription:
 *                                   type: string
 *                                   example: "Produit 100% naturel et bio"
 *                             variant:
 *                               type: object
 *                               properties:
 *                                 amount:
 *                                   type: number
 *                                   example: 500
 *                                 unit:
 *                                   type: string
 *                                   example: "g"
 *                                 price:
 *                                   type: number
 *                                   example: 25.99
 *                                 discountPrice:
 *                                   type: number
 *                                   example: 20.99
 *                                 isOnSale:
 *                                   type: boolean
 *                                   example: true
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                         example: "2025-10-10T14:25:00.000Z"
 *                 total:
 *                   type: integer
 *                   example: 12
 *                 len:
 *                   type: integer
 *                   example: 5
 *                 lastPage:
 *                   type: integer
 *                   example: 3
 *       401:
 *         description: Non authentifié — utilisateur non connecté
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
 *                   example: "Authentification requise"
 *       404:
 *         description: Aucune commande trouvée pour les critères donnés
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
router.get("/me", auth_1.verifyToken, (0, validate_1.validate)({ schema: validation_shema_1.queryOrderSchema, skipSave: true, key: "query" }), order_controller_1.getMyOrders); // détail d’une commande
/**
 * @swagger
 * /orders/{id}:
 *   get:
 *     summary: Récupérer une commande par son identifiant
 *     description: Retourne les détails complets d'une commande, y compris les informations utilisateur et les articles associés.
 *     tags:
 *       - Commandes
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Identifiant unique de la commande
 *     responses:
 *       200:
 *         description: Commande récupérée avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       example: "ord_abc123"
 *                     totalAmount:
 *                       type: number
 *                       example: 129.99
 *                     status:
 *                       type: string
 *                       example: "DELIVERED"
 *                     paymentStatus:
 *                       type: string
 *                       example: "PAID"
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                       example: "2025-10-14T13:40:00.000Z"
 *                     user:
 *                       type: object
 *                       properties:
 *                         firstName:
 *                           type: string
 *                           example: "Mohamed"
 *                         lastName:
 *                           type: string
 *                           example: "El Amrani"
 *                         email:
 *                           type: string
 *                           example: "mohamed@example.com"
 *                     items:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           quantity:
 *                             type: integer
 *                             example: 2
 *                           product:
 *                             type: object
 *                             properties:
 *                               id:
 *                                 type: string
 *                                 example: "prod_123"
 *                               title:
 *                                 type: string
 *                                 example: "Miel de lavande"
 *                           variant:
 *                             type: object
 *                             properties:
 *                               amount:
 *                                 type: number
 *                                 example: 500
 *                               unit:
 *                                 type: string
 *                                 example: "g"
 *                               price:
 *                                 type: number
 *                                 example: 12.99
 *                               discountPrice:
 *                                 type: number
 *                                 example: 9.99
 *                               isOnSale:
 *                                 type: boolean
 *                                 example: true
 *       404:
 *         description: Commande non trouvée
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
 *                   example: Commande non trouvée
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
 *                   example: Erreur serveur
 */
router.get("/:id", auth_1.verifyToken, auth_1.verifyAdmin, (0, validate_1.validate)({ schema: validation_shema_1.ValidationId, key: "params" }), order_controller_1.getOrderById);
router.put("/:id/cancel", auth_1.verifyToken, auth_1.verifyAdmin, (0, validate_1.validate)({ schema: validation_shema_1.ValidationId }), order_controller_1.cancelOrder); // annuler une commande
exports.default = router;
//# sourceMappingURL=order.routes.js.map