import { Router } from "express";
import { validate } from "../middlewares/validate";
import { verifyToken, verifyAdmin } from "../middlewares/auth";
import {
  CalculateShippingSchema,
  ShippingOptionsSchema,
  PacklinkQuoteSchema,
  UpdateTrackingSchema,
  MarkAsShippedSchema,
  CreatePacklinkLabelSchema,
} from "../schema/shipping.schema";
import {
  getShippingZones,
  calculateShipping,
  getShippingOptions,
  getPacklinkQuote,
  getOrderTracking,
  markAsShipped,
  updateTracking,
  createPacklinkLabel,
} from "../controller/shipping.controller";

const router = Router();

/**
 * @swagger
 * tags:
 *   - name: Livraison
 *     description: |
 *       Gestion complète des services de livraison et d'expédition.
 *       Cette section permet de **calculer les coûts**, **obtenir les options de livraison**, 
 *       **gérer le tracking** et **intégrer avec Packlink**.
 * 
 * components:
 *   schemas:
 *     ShippingAddress:
 *       type: object
 *       required:
 *         - address
 *         - city
 *         - country
 *         - zipCode
 *       properties:
 *         address:
 *           type: string
 *           minLength: 5
 *           description: Adresse complète de livraison
 *           example: "123 Rue de la Paix"
 *         city:
 *           type: string
 *           minLength: 2
 *           description: Ville de livraison
 *           example: "Paris"
 *         country:
 *           type: string
 *           pattern: "^[A-Z]{2}$"
 *           description: Code pays ISO 2 lettres
 *           example: "FR"
 *         zipCode:
 *           type: string
 *           minLength: 3
 *           description: Code postal
 *           example: "75001"
 *         phone:
 *           type: string
 *           description: Numéro de téléphone (optionnel)
 *           example: "+33123456789"
 *         name:
 *           type: string
 *           description: Nom du destinataire (optionnel)
 *           example: "Jean Dupont"
 *         email:
 *           type: string
 *           format: email
 *           description: Email du destinataire (optionnel)
 *           example: "jean.dupont@email.com"
 * 
 *     CalculateShipping:
 *       type: object
 *       required:
 *         - country
 *         - weight
 *       properties:
 *         country:
 *           type: string
 *           pattern: "^[A-Z]{2}$"
 *           description: Code pays ISO 2 lettres
 *           example: "FR"
 *         weight:
 *           type: number
 *           minimum: 0.1
 *           description: Poids en kilogrammes
 *           example: 1.5
 *         dimensions:
 *           type: object
 *           properties:
 *             width:
 *               type: number
 *               minimum: 0.1
 *               description: Largeur en cm
 *               example: 20
 *             height:
 *               type: number
 *               minimum: 0.1
 *               description: Hauteur en cm
 *               example: 15
 *             length:
 *               type: number
 *               minimum: 0.1
 *               description: Longueur en cm
 *               example: 30
 * 
 *     ShippingOptions:
 *       type: object
 *       required:
 *         - country
 *         - weight
 *       properties:
 *         country:
 *           type: string
 *           pattern: "^[A-Z]{2}$"
 *           description: Code pays ISO 2 lettres
 *           example: "FR"
 *         weight:
 *           type: number
 *           minimum: 0.1
 *           description: Poids total en kilogrammes
 *           example: 2.5
 *         address:
 *           $ref: '#/components/schemas/ShippingAddress'
 *         packages:
 *           type: array
 *           items:
 *             type: object
 *             required:
 *               - weight
 *             properties:
 *               weight:
 *                 type: number
 *                 minimum: 0.1
 *                 example: 1.2
 *               width:
 *                 type: number
 *                 minimum: 0.1
 *                 example: 20
 *               height:
 *                 type: number
 *                 minimum: 0.1
 *                 example: 15
 *               length:
 *                 type: number
 *                 minimum: 0.1
 *                 example: 30
 * 
 *     PacklinkQuote:
 *       type: object
 *       required:
 *         - from
 *         - to
 *         - packages
 *       properties:
 *         from:
 *           type: object
 *           required:
 *             - country
 *             - zipCode
 *           properties:
 *             country:
 *               type: string
 *               pattern: "^[A-Z]{2}$"
 *               example: "FR"
 *             zipCode:
 *               type: string
 *               example: "75001"
 *             city:
 *               type: string
 *               example: "Paris"
 *             address:
 *               type: string
 *               example: "Warehouse Street 1"
 *         to:
 *           type: object
 *           required:
 *             - country
 *             - zipCode
 *             - city
 *             - address
 *           properties:
 *             country:
 *               type: string
 *               pattern: "^[A-Z]{2}$"
 *               example: "BE"
 *             zipCode:
 *               type: string
 *               example: "1000"
 *             city:
 *               type: string
 *               example: "Bruxelles"
 *             address:
 *               type: string
 *               example: "Avenue Louise 123"
 *         packages:
 *           type: array
 *           minItems: 1
 *           items:
 *             type: object
 *             required:
 *               - weight
 *               - width
 *               - height
 *               - length
 *             properties:
 *               weight:
 *                 type: number
 *                 minimum: 0.1
 *                 example: 2.5
 *               width:
 *                 type: number
 *                 minimum: 0.1
 *                 example: 25
 *               height:
 *                 type: number
 *                 minimum: 0.1
 *                 example: 20
 *               length:
 *                 type: number
 *                 minimum: 0.1
 *                 example: 35
 * 
 *     UpdateTracking:
 *       type: object
 *       required:
 *         - trackingNumber
 *       properties:
 *         trackingNumber:
 *           type: string
 *           minLength: 5
 *           description: Numéro de suivi
 *           example: "1Z999AA1234567890"
 *         carrier:
 *           type: string
 *           description: Nom du transporteur
 *           example: "UPS"
 *         trackingUrl:
 *           type: string
 *           format: uri
 *           description: URL de suivi
 *           example: "https://www.ups.com/track?tracknum=1Z999AA1234567890"
 * 
 *     MarkAsShipped:
 *       type: object
 *       properties:
 *         trackingNumber:
 *           type: string
 *           description: Numéro de suivi
 *           example: "1Z999AA1234567890"
 *         shippingMethod:
 *           type: string
 *           description: Méthode de livraison
 *           example: "Express"
 *         shippingProvider:
 *           type: string
 *           description: Fournisseur de livraison
 *           example: "UPS"
 * 
 *     CreatePacklinkLabel:
 *       type: object
 *       required:
 *         - serviceId
 *         - shipmentId
 *       properties:
 *         serviceId:
 *           type: string
 *           minLength: 1
 *           description: ID du service Packlink
 *           example: "ups-express"
 *         shipmentId:
 *           type: string
 *           minLength: 1
 *           description: ID de l'envoi
 *           example: "PKL123456789"
 * 
 *     ShippingZone:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           example: "zone-fr"
 *         name:
 *           type: string
 *           example: "France métropolitaine"
 *         countries:
 *           type: array
 *           items:
 *             type: string
 *           example: ["FR"]
 *         basePrice:
 *           type: number
 *           example: 5.99
 *         weightThreshold:
 *           type: number
 *           example: 2
 *         additionalWeightPrice:
 *           type: number
 *           example: 1.50
 * 
 *     ShippingMethod:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           example: "standard"
 *         name:
 *           type: string
 *           example: "Livraison standard"
 *         description:
 *           type: string
 *           example: "Livraison en 3-5 jours ouvrables"
 *         price:
 *           type: number
 *           example: 5.99
 *         estimatedDays:
 *           type: integer
 *           example: 5
 *         carrier:
 *           type: string
 *           example: "La Poste"
 * 
 *     OrderTracking:
 *       type: object
 *       properties:
 *         orderId:
 *           type: string
 *           example: "ORD123456"
 *         status:
 *           type: string
 *           enum: [pending, processing, shipped, delivered, cancelled]
 *           example: "shipped"
 *         trackingNumber:
 *           type: string
 *           example: "1Z999AA1234567890"
 *         carrier:
 *           type: string
 *           example: "UPS"
 *         trackingUrl:
 *           type: string
 *           example: "https://www.ups.com/track?tracknum=1Z999AA1234567890"
 *         shippedAt:
 *           type: string
 *           format: date-time
 *           example: "2024-01-15T10:30:00Z"
 *         estimatedDelivery:
 *           type: string
 *           format: date-time
 *           example: "2024-01-20T18:00:00Z"
 * 
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */

/**
 * @swagger
 * /api/shipping/zones:
 *   get:
 *     summary: Obtenir toutes les zones de livraison
 *     description: Récupère la liste complète des zones de livraison configurées avec leurs tarifs
 *     tags: [Livraison]
 *     responses:
 *       200:
 *         description: Liste des zones de livraison récupérée avec succès
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
 *                   example: "Zones de livraison récupérées avec succès"
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/ShippingZone'
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
 *                   example: "Erreur lors de la récupération des zones"
 */
router.get("/zones", getShippingZones);

/**
 * @swagger
 * /api/shipping/calculate:
 *   post:
 *     summary: Calculer le coût de livraison
 *     description: Calcule le coût de livraison en fonction du pays, du poids et des dimensions
 *     tags: [Livraison]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CalculateShipping'
 *           examples:
 *             simple:
 *               summary: Calcul simple par poids
 *               value:
 *                 country: "FR"
 *                 weight: 1.5
 *             withDimensions:
 *               summary: Avec dimensions
 *               value:
 *                 country: "BE"
 *                 weight: 2.5
 *                 dimensions:
 *                   width: 30
 *                   height: 20
 *                   length: 40
 *     responses:
 *       200:
 *         description: Coût de livraison calculé avec succès
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
 *                   example: "Coût calculé avec succès"
 *                 data:
 *                   type: object
 *                   properties:
 *                     baseCost:
 *                       type: number
 *                       example: 5.99
 *                     weightCost:
 *                       type: number
 *                       example: 2.50
 *                     totalCost:
 *                       type: number
 *                       example: 8.49
 *                     currency:
 *                       type: string
 *                       example: "EUR"
 *                     zone:
 *                       type: string
 *                       example: "Union Européenne"
 *       400:
 *         description: Données invalides
 *       404:
 *         description: Zone de livraison non trouvée pour ce pays
 */
router.post(
  "/calculate",
  validate({ schema: CalculateShippingSchema }),
  calculateShipping
);

/**
 * @swagger
 * /api/shipping/options:
 *   post:
 *     summary: Obtenir les options de livraison
 *     description: Récupère toutes les options de livraison disponibles pour une destination donnée
 *     tags: [Livraison]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ShippingOptions'
 *           examples:
 *             basic:
 *               summary: Recherche basique
 *               value:
 *                 country: "FR"
 *                 weight: 2.0
 *             detailed:
 *               summary: Avec adresse et colis multiples
 *               value:
 *                 country: "BE"
 *                 weight: 3.5
 *                 address:
 *                   address: "Avenue Louise 123"
 *                   city: "Bruxelles"
 *                   country: "BE"
 *                   zipCode: "1000"
 *                 packages:
 *                   - weight: 1.5
 *                     width: 20
 *                     height: 15
 *                     length: 25
 *                   - weight: 2.0
 *                     width: 30
 *                     height: 20
 *                     length: 35
 *     responses:
 *       200:
 *         description: Options de livraison récupérées avec succès
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
 *                   example: "Options de livraison récupérées"
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/ShippingMethod'
 *       400:
 *         description: Données invalides
 *       404:
 *         description: Aucune option disponible pour cette destination
 */
router.post(
  "/options",
  validate({ schema: ShippingOptionsSchema,skipSave: true }),
  getShippingOptions
);

/**
 * @swagger
 * /api/shipping/packlink/quote:
 *   post:
 *     summary: Obtenir un devis Packlink
 *     description: Récupère les tarifs et services disponibles via l'API Packlink
 *     tags: [Livraison]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PacklinkQuote'
 *           example:
 *             from:
 *               country: "FR"
 *               zipCode: "75001"
 *               city: "Paris"
 *               address: "Entrepôt Central"
 *             to:
 *               country: "BE"
 *               zipCode: "1000"
 *               city: "Bruxelles"
 *               address: "Avenue Louise 123"
 *             packages:
 *               - weight: 2.5
 *                 width: 25
 *                 height: 20
 *                 length: 35
 *     responses:
 *       200:
 *         description: Devis Packlink récupéré avec succès
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
 *                   example: "Devis Packlink récupéré"
 *                 data:
 *                   type: object
 *                   properties:
 *                     services:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             example: "ups-express"
 *                           name:
 *                             type: string
 *                             example: "UPS Express"
 *                           price:
 *                             type: number
 *                             example: 15.99
 *                           currency:
 *                             type: string
 *                             example: "EUR"
 *                           transitTime:
 *                             type: integer
 *                             example: 2
 *                           carrier:
 *                             type: string
 *                             example: "UPS"
 *       400:
 *         description: Données invalides
 *       502:
 *         description: Erreur de communication avec l'API Packlink
 */
router.post(
  "/packlink/quote",
  validate({ schema: PacklinkQuoteSchema }),
  getPacklinkQuote
);

/**
 * @swagger
 * /api/shipping/orders/{id}/tracking:
 *   get:
 *     summary: Obtenir le tracking d'une commande
 *     description: Récupère les informations de suivi pour une commande spécifique
 *     tags: [Livraison]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la commande
 *         example: "ORD123456"
 *     responses:
 *       200:
 *         description: Informations de tracking récupérées
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
 *                   example: "Tracking récupéré avec succès"
 *                 data:
 *                   $ref: '#/components/schemas/OrderTracking'
 *       401:
 *         description: Non authentifié
 *       404:
 *         description: Commande non trouvée
 *       500:
 *         description: Erreur serveur
 */
router.get("/orders/:id/tracking", verifyToken, getOrderTracking);

/**
 * @swagger
 * /api/shipping/orders/{id}/ship:
 *   post:
 *     summary: Marquer une commande comme expédiée
 *     description: |
 *       Met à jour le statut d'une commande en "expédiée" avec les informations d'expédition.
 *       **Accès administrateur requis.**
 *     tags: [Livraison]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la commande
 *         example: "ORD123456"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/MarkAsShipped'
 *           example:
 *             trackingNumber: "1Z999AA1234567890"
 *             shippingMethod: "Express"
 *             shippingProvider: "UPS"
 *     responses:
 *       200:
 *         description: Commande marquée comme expédiée
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
 *                   example: "Commande marquée comme expédiée"
 *                 data:
 *                   $ref: '#/components/schemas/OrderTracking'
 *       400:
 *         description: Données invalides
 *       401:
 *         description: Non authentifié
 *       403:
 *         description: Accès administrateur requis
 *       404:
 *         description: Commande non trouvée
 */
router.post(
  "/orders/:id/ship",
  verifyToken,
  verifyAdmin,
  validate({ schema: MarkAsShippedSchema }),
  markAsShipped
);

/**
 * @swagger
 * /api/shipping/orders/{id}/tracking:
 *   patch:
 *     summary: Mettre à jour les informations de tracking
 *     description: |
 *       Met à jour les informations de suivi d'une commande expédiée.
 *       **Accès administrateur requis.**
 *     tags: [Livraison]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la commande
 *         example: "ORD123456"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateTracking'
 *           example:
 *             trackingNumber: "1Z999AA1234567890"
 *             carrier: "UPS"
 *             trackingUrl: "https://www.ups.com/track?tracknum=1Z999AA1234567890"
 *     responses:
 *       200:
 *         description: Tracking mis à jour avec succès
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
 *                   example: "Tracking mis à jour avec succès"
 *                 data:
 *                   $ref: '#/components/schemas/OrderTracking'
 *       400:
 *         description: Données invalides ou URL de tracking invalide
 *       401:
 *         description: Non authentifié
 *       403:
 *         description: Accès administrateur requis
 *       404:
 *         description: Commande non trouvée
 */
router.patch(
  "/orders/:id/tracking",
  verifyToken,
  verifyAdmin,
  validate({ schema: UpdateTrackingSchema }),
  updateTracking
);

/**
 * @swagger
 * /api/shipping/orders/{id}/packlink/label:
 *   post:
 *     summary: Créer une étiquette Packlink
 *     description: |
 *       Génère une étiquette d'expédition via l'API Packlink pour une commande.
 *       **Accès administrateur requis.**
 *     tags: [Livraison]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la commande
 *         example: "ORD123456"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreatePacklinkLabel'
 *           example:
 *             serviceId: "ups-express"
 *             shipmentId: "PKL123456789"
 *     responses:
 *       201:
 *         description: Étiquette créée avec succès
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
 *                   example: "Étiquette Packlink créée avec succès"
 *                 data:
 *                   type: object
 *                   properties:
 *                     labelUrl:
 *                       type: string
 *                       format: uri
 *                       example: "https://api.packlink.com/labels/PKL123456789.pdf"
 *                     trackingNumber:
 *                       type: string
 *                       example: "1Z999AA1234567890"
 *                     serviceId:
 *                       type: string
 *                       example: "ups-express"
 *                     shipmentId:
 *                       type: string
 *                       example: "PKL123456789"
 *                     carrier:
 *                       type: string
 *                       example: "UPS"
 *       400:
 *         description: Données invalides ou service non disponible
 *       401:
 *         description: Non authentifié
 *       403:
 *         description: Accès administrateur requis
 *       404:
 *         description: Commande non trouvée
 *       502:
 *         description: Erreur de communication avec l'API Packlink
 */
router.post(
  "/orders/:id/packlink/label",
  verifyToken,
  verifyAdmin,
  validate({ schema: CreatePacklinkLabelSchema }),
  createPacklinkLabel
);

export default router;

