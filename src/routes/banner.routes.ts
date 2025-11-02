import * as bannerController from "../controller/banner.controller";
import { verifyToken, verifyAdmin } from "../middlewares/auth";
import { ValidationId } from "../schema/validation.shema";
import {
  bannerUpdateSchema,
  createBannerSchema,
} from "../schema/banner.schema";
import { validate } from "../middlewares/validate";
import {
  uploadBannerMiddleware,
  validateBannerImages,
} from "../middlewares/uploadMiddleware";
import { Router } from "express";
const router = Router();
/**
 * @swagger
 * tags:
 *   - name: Bannières
 *     description: |
 *       Gestion complète des bannières promotionnelles affichées sur le site.
 *       Cette section permet de **créer**, **mettre à jour**, **supprimer** et **récupérer** les bannières utilisées pour les campagnes marketing ou les promotions de produits.
 */

router.get("/", bannerController.getAllBanners);
/**
 * @swagger
 * /banners:
 *   post:
 *     summary: Créer une nouvelle bannière
 *     description: |
 *       Cette route permet de **créer une nouvelle bannière promotionnelle ou informative** avec ses images (desktop et mobile).
 *
 *       **Fonctionnalités :**
 *       - Vérifie si une bannière avec le même titre, type et linkType existe déjà.
 *       - Upload les images vers **Cloudinary** (desktop et/ou mobile).
 *       - Enregistre les informations validées dans la base de données via **Prisma**.
 *       - Supprime automatiquement les images uploadées en cas d’échec d’une opération.
 *
 *       **Remarques :**
 *       - Les images sont optionnelles, mais fortement recommandées pour l’affichage.
 *       - Les champs `categoryId`, `productId`, et `packId` sont utilisés selon le `linkType`.
 *       - Les dates `startAt` et `endAt` permettent de définir la période d’affichage de la bannière.
 *
 *       **Types disponibles :**
 *       - `BannerType`
 *         - `GENERAL` : Bannière générique
 *         - `PROMOTION` : Promotion ou offre spéciale
 *         - `EVENT` : Événement particulier
 *         - `ANNOUNCEMENT` : Annonce générale
 *         - `FLASH_SALE` : Vente flash
 *
 *       - `BannerLinkType`
 *         - `NONE` : Aucun lien (bannière informative)
 *         - `CATEGORY` : Lien vers une catégorie
 *         - `PRODUCT` : Lien vers un produit spécifique
 *         - `PACK` : Lien vers un pack promotionnel
 *
 *     tags:
 *       - Bannières
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 description: Titre de la bannière.
 *                 example: "Offre Spéciale d’Automne"
 *               text:
 *                 type: string
 *                 description: Texte principal de la bannière.
 *                 example: "Profitez de -30% sur toute la collection automne"
 *               buttonText:
 *                 type: string
 *                 description: Texte du bouton d’action (facultatif).
 *                 example: "Découvrir maintenant"
 *               linkType:
 *                 type: string
 *                 description: Type de lien associé à la bannière.
 *                 enum: [NONE, CATEGORY, PRODUCT, PACK]
 *                 example: "CATEGORY"
 *               type:
 *                 type: string
 *                 description: Type de la bannière.
 *                 enum: [GENERAL, PROMOTION, EVENT, ANNOUNCEMENT, FLASH_SALE]
 *                 example: "PROMOTION"
 *               categoryId:
 *                 type: string
 *                 format: uuid
 *                 description: ID de la catégorie associée (si linkType = CATEGORY).
 *                 example: "c7d2c4c9-8f56-4c2a-a3a5-2d65e1f0c111"
 *               productId:
 *                 type: string
 *                 format: uuid
 *                 description: ID du produit associé (si linkType = PRODUCT).
 *                 example: "ae63d8c9-1b22-4f7c-9c1e-94d5a9f2a7f2"
 *               packId:
 *                 type: string
 *                 format: uuid
 *                 description: ID du pack associé (si linkType = PACK).
 *                 example: "a72d1a0b-6b19-4ad8-8c1a-3a54c1f6d912"
 *               isActive:
 *                 type: boolean
 *                 description: Indique si la bannière est active.
 *                 example: true
 *               startAt:
 *                 type: string
 *                 format: date-time
 *                 description: Date de début d’affichage de la bannière (facultatif).
 *                 example: "2025-11-01T00:00:00.000Z"
 *               endAt:
 *                 type: string
 *                 format: date-time
 *                 description: Date de fin d’affichage de la bannière (facultatif).
 *                 example: "2025-12-01T00:00:00.000Z"
 *               desktopImage:
 *                 type: string
 *                 format: binary
 *                 description: Image principale de la bannière pour les écrans desktop (facultative).
 *               mobileImage:
 *                 type: string
 *                 format: binary
 *                 description: Image de la bannière adaptée pour mobile (facultative).
 *             required:
 *               - title
 *               - text
 *               - linkType
 *               - type
 *               - desktopImage
 *     responses:
 *       201:
 *         description: Bannière créée avec succès
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
 *                   example: "Bannière créée avec succès"
 *                 newBanner:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       example: "b77e9c42-5bfa-4b1c-8c53-3d0120b93f15"
 *                     title:
 *                       type: string
 *                       example: "Offre Spéciale d’Automne"
 *                     text:
 *                       type: string
 *                       example: "Profitez de -30% sur toute la collection automne"
 *                     buttonText:
 *                       type: string
 *                       example: "Découvrir maintenant"
 *                     linkType:
 *                       type: string
 *                       example: "CATEGORY"
 *                     type:
 *                       type: string
 *                       example: "PROMOTION"
 *                     isActive:
 *                       type: boolean
 *                       example: true
 *                     startAt:
 *                       type: string
 *                       format: date-time
 *                       example: "2025-11-01T00:00:00.000Z"
 *                     endAt:
 *                       type: string
 *                       format: date-time
 *                       example: "2025-12-01T00:00:00.000Z"
 *                     desktopImage:
 *                       type: string
 *                       example: "https://res.cloudinary.com/demo/image/upload/v12345/banner-desktop.jpg"
 *                     mobileImage:
 *                       type: string
 *                       example: "https://res.cloudinary.com/demo/image/upload/v12345/banner-mobile.jpg"
 *       409:
 *         description: Bannière déjà existante
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
 *                   example: "Une bannière avec le même titre et type existe déjà."
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
  uploadBannerMiddleware,
  validateBannerImages,
  validate({ schema: createBannerSchema, skipSave: true }),
  bannerController.createBanner
);
/**
 * @swagger
 * /banners/{id}:
 *   patch:
 *     summary: Mettre à jour une bannière existante
 *     description: |
 *       Cette route permet de **modifier une bannière existante**, y compris ses images, son type, ses textes et ses liens associés.
 *
 *       **Fonctionnalités :**
 *       - Vérifie si la bannière existe avant la mise à jour.
 *       - Permet de remplacer l’image *desktop* et/ou *mobile* (upload vers **Cloudinary**).
 *       - Met à jour uniquement les champs modifiés (validation Zod).
 *       - Supprime automatiquement les anciennes images Cloudinary remplacées.
 *       - Nettoie les références (`productId`, `categoryId`, `packId`) selon le `linkType` choisi.
 *
 *       **Types disponibles :**
 *       - `BannerType`
 *         - `GENERAL` : Bannière générique
 *         - `PROMOTION` : Promotion ou offre spéciale
 *         - `EVENT` : Événement particulier
 *         - `ANNOUNCEMENT` : Annonce générale
 *         - `FLASH_SALE` : Vente flash
 *
 *       - `BannerLinkType`
 *         - `NONE` : Aucun lien (bannière informative)
 *         - `CATEGORY` : Lien vers une catégorie
 *         - `PRODUCT` : Lien vers un produit spécifique
 *         - `PACK` : Lien vers un pack promotionnel
 *
 *     tags:
 *       - Bannières
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: Identifiant unique de la bannière à mettre à jour.
 *         schema:
 *           type: string
 *           format: uuid
 *           example: "b77e9c42-5bfa-4b1c-8c53-3d0120b93f15"
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 description: Nouveau titre de la bannière (facultatif).
 *                 example: "Offre Spéciale d’Hiver"
 *               text:
 *                 type: string
 *                 description: Nouveau texte principal.
 *                 example: "Jusqu’à -40% sur les manteaux et bottes"
 *               buttonText:
 *                 type: string
 *                 description: Texte du bouton d’action (facultatif).
 *                 example: "Voir la collection"
 *               linkType:
 *                 type: string
 *                 description: Type de lien associé à la bannière.
 *                 enum: [NONE, CATEGORY, PRODUCT, PACK]
 *                 example: "PRODUCT"
 *               type:
 *                 type: string
 *                 description: Type de la bannière.
 *                 enum: [GENERAL, PROMOTION, EVENT, ANNOUNCEMENT, FLASH_SALE]
 *                 example: "EVENT"
 *               categoryId:
 *                 type: string
 *                 format: uuid
 *                 description: ID de la catégorie associée (si linkType = CATEGORY).
 *                 example: "c7d2c4c9-8f56-4c2a-a3a5-2d65e1f0c111"
 *               productId:
 *                 type: string
 *                 format: uuid
 *                 description: ID du produit associé (si linkType = PRODUCT).
 *                 example: "ae63d8c9-1b22-4f7c-9c1e-94d5a9f2a7f2"
 *               packId:
 *                 type: string
 *                 format: uuid
 *                 description: ID du pack associé (si linkType = PACK).
 *                 example: "a72d1a0b-6b19-4ad8-8c1a-3a54c1f6d912"
 *               isActive:
 *                 type: boolean
 *                 description: Indique si la bannière est active.
 *                 example: true
 *               startAt:
 *                 type: string
 *                 format: date-time
 *                 description: Nouvelle date de début d’affichage (facultative).
 *                 example: "2025-12-01T00:00:00.000Z"
 *               endAt:
 *                 type: string
 *                 format: date-time
 *                 description: Nouvelle date de fin d’affichage (facultative).
 *                 example: "2026-01-10T00:00:00.000Z"
 *               desktopImage:
 *                 type: string
 *                 format: binary
 *                 description: Nouvelle image pour les écrans desktop (facultative, remplace l’ancienne sur Cloudinary).
 *               mobileImage:
 *                 type: string
 *                 format: binary
 *                 description: Nouvelle image pour les mobiles (facultative, remplace l’ancienne sur Cloudinary).
 *     responses:
 *       200:
 *         description: Bannière mise à jour avec succès
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
 *                   example: "Bannière mise à jour avec succès"
 *                 updatedBanner:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       example: "b77e9c42-5bfa-4b1c-8c53-3d0120b93f15"
 *                     title:
 *                       type: string
 *                       example: "Offre Spéciale d’Hiver"
 *                     text:
 *                       type: string
 *                       example: "Jusqu’à -40% sur les manteaux et bottes"
 *                     buttonText:
 *                       type: string
 *                       example: "Voir la collection"
 *                     linkType:
 *                       type: string
 *                       example: "PRODUCT"
 *                     type:
 *                       type: string
 *                       example: "EVENT"
 *                     startAt:
 *                       type: string
 *                       format: date-time
 *                       example: "2025-12-01T00:00:00.000Z"
 *                     endAt:
 *                       type: string
 *                       format: date-time
 *                       example: "2026-01-10T00:00:00.000Z"
 *                     desktopImage:
 *                       type: string
 *                       example: "https://res.cloudinary.com/demo/image/upload/v12345/banner-desktop.jpg"
 *                     mobileImage:
 *                       type: string
 *                       example: "https://res.cloudinary.com/demo/image/upload/v12345/banner-mobile.jpg"
 *       400:
 *         description: Aucune donnée valide fournie pour la mise à jour
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
 *         description: Bannière non trouvée
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
 *                   example: "Bannière non trouvée"
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

router.patch(
  "/:id",
  verifyToken,
  verifyAdmin,
  uploadBannerMiddleware,
  // validateBannerImages,
  validate({ schema: ValidationId, key: "params" }),
  validate({ schema: bannerUpdateSchema, skipSave: true }),
  bannerController.updateBanner
);
/**
 * @swagger
 * /banners/{id}:
 *   delete:
 *     summary: Supprimer une bannière
 *     description: |
 *       Cette route permet de **supprimer une bannière** existante ainsi que ses images associées sur **Cloudinary**.  
 *       
 *       - Vérifie d’abord si la bannière existe.  
 *       - Supprime la bannière de la base de données.  
 *       - Supprime ensuite les images liées (`desktopImage`, `mobileImage`) de Cloudinary si elles existent.  
 *       - Renvoie un message de confirmation après la suppression.  
 *       
 *       ⚠️ **Note :** La suppression est définitive et ne peut pas être annulée.
 *     tags:
 *       - Bannières
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           example: "d1b4f57a-7a63-4c15-89d0-98e9a01e65b7"
 *         description: Identifiant unique de la bannière à supprimer.
 *     responses:
 *       200:
 *         description: Bannière supprimée avec succès.
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
 *                   example: "Bannière supprimée avec succès"
 *       404:
 *         description: Bannière non trouvée.
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
 *                   example: "Bannière non trouvée"
 *       500:
 *         description: Erreur interne du serveur (ex. problème de suppression Cloudinary ou DB).
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

router.delete(
  "/:id",
  verifyToken,
  verifyAdmin,
  validate({ schema: ValidationId, key: "params" }),
  bannerController.deleteBanner
);
export default router;
