import { verifyAdmin, verifyToken } from "../middlewares/auth";
import { Router } from "express";
import {
  deleteUser,
  deleteUserById,
  getAllUsers,
  getCurrentUser,
  getProffile,
  updateCurrentUser,
} from "../controller/user.controller";
import { validate } from "../middlewares/validate";
import {  userSchema } from "../schema/user.schema";

const router = Router();
/**
 * @swagger
 * tags:
 *   - name: Utilisateurs
 *     description: Gestion des utilisateurs (affichage, suppression, rôle admin)
 */

/**
 * @swagger
 * /users:
 *   get:
 *     summary: Récupère tous les utilisateurs
 *     tags:
 *       - Utilisateurs
 *     responses:
 *       200:
 *         description: Liste de tous les utilisateurs
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 success:
 *                   type: boolean
 *                 users:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       name:
 *                         type: string
 *                       email:
 *                         type: string
 *                       role:
 *                         type: string
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *             example:
 *               message: "all users"
 *               success: true
 *               users:
 *                 - id: "64f2c5e7b5e7e72f12345678"
 *                   name: "John Doe"
 *                   email: "john@example.com"
 *                   role: "user"
 *                   createdAt: "2025-09-23T17:00:00Z"
 *                 - id: "64f2c5e7b5e7e72f12345679"
 *                   name: "Jane Smith"
 *                   email: "jane@example.com"
 *                   role: "admin"
 *                   createdAt: "2025-09-23T18:00:00Z"
 *       500:
 *         description: Erreur interne du serveur
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 message: "Une erreur est survenue côté serveur"
 *                 success: false
 */

router.get("/users", verifyToken, verifyAdmin, getAllUsers);
/**
 * @swagger
 * /users/me:
 *   get:
 *     summary: Récupère le profil de l'utilisateur connecté
 *     description: |
 *       Cette route retourne les informations du profil de l'utilisateur actuellement authentifié.
 *       Le token JWT doit être envoyé dans les cookies (HttpOnly) ou dans les en-têtes d'autorisation.
 *     tags:
 *       - Utilisateurs
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profil de l'utilisateur récupéré avec succès.
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
 *                       example: "b3c0a7c2-9f6e-4b55-b4dc-88e77f3b3a2a"
 *                     email:
 *                       type: string
 *                       example: "user@example.com"
 *                     firstName:
 *                       type: string
 *                       example: "John"
 *                     lastName:
 *                       type: string
 *                       example: "Doe"
 *                     role:
 *                       type: string
 *                       enum: [ADMIN, USER]
 *                       example: "USER"
 *                     phoneNumber:
 *                       type: string
 *                       example: "+212600000000"
 *                     postalCode:
 *                       type: string
 *                       example: "75001"
 *                     country:
 *                       type: string
 *                       example: "Maroc"
 *                     city:
 *                       type: string
 *                       example: "Casablanca"
 *                     address:
 *                       type: string
 *                       example: "123 Rue Exemple"
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                       example: "2025-09-29T10:15:30.000Z"
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *                       example: "2025-10-02T11:45:00.000Z"
 *       404:
 *         description: Utilisateur non trouvé.
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
 *                   example: "Utilisateur non trouvé"
 *       500:
 *         description: Erreur interne du serveur.
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

router.get("/users/me", verifyToken, getProffile);
/**git commit -m'
 * @openapi
 * /me:
 *   get:
 *     summary: Récupérer l'utilisateur connecté
 *     description: Retourne les infos de l'utilisateur basé sur le cookie JWT.
 *     tags:
 *       - Utilisateurs
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Infos utilisateur récupérées
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 email:
 *                   type: string
 *                 role:
 *                   type: string
 *       401:
 *         description: Non authentifié
 *       500:
 *         description: Erreur serveur
 */
router.get("/me", verifyToken, getCurrentUser);
/**
 * @swagger
 * /users/me:
 *   patch:
 *     summary: Modifie les informations personnelles de l'utilisateur connecté
 *     description: |
 *       Permet à un utilisateur authentifié de mettre à jour ses informations personnelles.
 *
 *       **Champs modifiables :**
 *       - Informations personnelles : prénom, nom, téléphone
 *       - Adresse complète : adresse, ville, code postal, pays
 *
 *       **Règles importantes :**
 *       - Tous les champs sont optionnels (seuls les champs fournis seront mis à jour)
 *       - L'email et le rôle ne peuvent pas être modifiés via cette route
 *       - Les données sont validées selon les règles métier
 *       - La mise à jour est atomique (tout ou rien)
 *     tags:
 *       - Utilisateurs
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             additionalProperties: false
 *             properties:
 *               firstName:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 50
 *                 pattern: "^[a-zA-ZÀ-ÿ\\s\\-']+$"
 *                 description: |
 *                   **Prénom de l'utilisateur**
 *
 *                   Règles de validation :
 *                   - Entre 2 et 50 caractères
 *                   - Lettres uniquement (accents autorisés)
 *                   - Espaces, traits d'union et apostrophes acceptés
 *                   - Pas de chiffres ou caractères spéciaux
 *                 example: "Mohamed"
 *               lastName:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 50
 *                 pattern: "^[a-zA-ZÀ-ÿ\\s\\-']+$"
 *                 description: |
 *                   **Nom de famille de l'utilisateur**
 *
 *                   Règles de validation :
 *                   - Entre 2 et 50 caractères
 *                   - Lettres uniquement (accents autorisés)
 *                   - Espaces, traits d'union et apostrophes acceptés
 *                   - Formats acceptés : "Ben Ali", "El-Fassi", "O'Connor"
 *                 example: "Ben Ali"
 *               phoneNumber:
 *                 type: string
 *                 pattern: "^\\+?[1-9]\\d{8,14}$"
 *                 nullable: true
 *                 description: |
 *                   **Numéro de téléphone au format international**
 *
 *                   Règles de validation :
 *                   - Format international recommandé (+XXX...)
 *                   - Entre 9 et 15 chiffres après le code pays
 *                   - Commence par + suivi du code pays (optionnel)
 *                   - Exemples valides : "+212600123456", "0600123456"
 *                   - Null pour supprimer le numéro existant
 *                 example: "+212600123456"
 *               address:
 *                 type: string
 *                 minLength: 5
 *                 maxLength: 200
 *                 nullable: true
 *                 description: |
 *                   **Adresse complète de résidence**
 *
 *                   Règles de validation :
 *                   - Entre 5 et 200 caractères
 *                   - Doit inclure le numéro et le nom de rue
 *                   - Peut inclure appartement, bâtiment, quartier
 *                   - Caractères spéciaux autorisés : , . - / # °
 *                   - Null pour supprimer l'adresse existante
 *                 example: "123 Rue Hassan II, Apt 4B, Quartier Maarif"
 *               city:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 100
 *                 pattern: "^[a-zA-ZÀ-ÿ\\s\\-']+$"
 *                 nullable: true
 *                 description: |
 *                   **Ville de résidence**
 *
 *                   Règles de validation :
 *                   - Entre 2 et 100 caractères
 *                   - Lettres uniquement (accents autorisés)
 *                   - Espaces et traits d'union acceptés
 *                   - Exemples : "Casablanca", "Aït-Melloul", "Sidi Bel Abbès"
 *                   - Null pour supprimer la ville existante
 *                 example: "Casablanca"
 *               postalCode:
 *                 type: string
 *                 pattern: "^[0-9]{5}$"
 *                 nullable: true
 *                 description: |
 *                   **Code postal à 5 chiffres**
 *
 *                   Règles de validation :
 *                   - Exactement 5 chiffres
 *                   - Format marocain standard
 *                   - Exemples valides : "20000", "10000", "30000"
 *                   - Null pour supprimer le code postal existant
 *                 example: "20000"
 *               country:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 100
 *                 pattern: "^[a-zA-ZÀ-ÿ\\s\\-']+$"
 *                 nullable: true
 *                 description: |
 *                   **Pays de résidence**
 *
 *                   Règles de validation :
 *                   - Entre 2 et 100 caractères
 *                   - Lettres uniquement (accents autorisés)
 *                   - Espaces et traits d'union acceptés
 *                   - Nom complet du pays en français
 *                   - Exemples : "Maroc", "France", "Côte d'Ivoire"
 *                   - Null pour supprimer le pays existant
 *                 example: "Maroc"
 *           examples:
 *             mise_a_jour_complete:
 *               summary: "Mise à jour complète du profil"
 *               description: "Exemple de modification de toutes les informations"
 *               value:
 *                 firstName: "Ahmed"
 *                 lastName: "El Fassi"
 *                 phoneNumber: "+212661234567"
 *                 address: "456 Boulevard Mohammed V, Quartier Agdal"
 *                 city: "Rabat"
 *                 postalCode: "10000"
 *                 country: "Maroc"
 *             mise_a_jour_partielle:
 *               summary: "Mise à jour du nom seulement"
 *               description: "Exemple de modification partielle"
 *               value:
 *                 firstName: "Youssef"
 *                 lastName: "Bennani"
 *             ajout_telephone:
 *               summary: "Ajout du numéro de téléphone"
 *               description: "Ajout d'un numéro pour un profil incomplet"
 *               value:
 *                 phoneNumber: "+212612345678"
 *             suppression_adresse:
 *               summary: "Suppression de l'adresse"
 *               description: "Utiliser null pour supprimer des champs optionnels"
 *               value:
 *                 address: null
 *                 city: null
 *                 postalCode: null
 *     responses:
 *       200:
 *         description: Informations mises à jour avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                   description: "Indique que la mise à jour a réussi"
 *                 message:
 *                   type: string
 *                   example: "Profil mis à jour avec succès"
 *                   description: "Message de confirmation"
 *                 data:
 *                   type: object
 *                   description: "Profil utilisateur mis à jour"
 *                   properties:
 *                     id:
 *                       type: string
 *                       example: "550e8400-e29b-41d4-a716-446655440000"
 *                     email:
 *                       type: string
 *                       example: "user@example.com"
 *                     firstName:
 *                       type: string
 *                       example: "Ahmed"
 *                     lastName:
 *                       type: string
 *                       example: "El Fassi"
 *                     phoneNumber:
 *                       type: string
 *                       example: "+212661234567"
 *                     address:
 *                       type: string
 *                       example: "456 Boulevard Mohammed V, Quartier Agdal"
 *                     city:
 *                       type: string
 *                       example: "Rabat"
 *                     postalCode:
 *                       type: string
 *                       example: "10000"
 *                     country:
 *                       type: string
 *                       example: "Maroc"
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *                       example: "2025-11-14T16:45:30.000Z"
 *             examples:
 *               success_response:
 *                 summary: "Réponse de succès"
 *                 value:
 *                   success: true
 *                   message: "Profil mis à jour avec succès"
 *                   data:
 *                     id: "550e8400-e29b-41d4-a716-446655440000"
 *                     email: "mohamed@example.com"
 *                     firstName: "Ahmed"
 *                     lastName: "El Fassi"
 *                     phoneNumber: "+212661234567"
 *                     address: "456 Boulevard Mohammed V, Quartier Agdal"
 *                     city: "Rabat"
 *                     postalCode: "10000"
 *                     country: "Maroc"
 *                     updatedAt: "2025-11-14T16:45:30.000Z"
 *       400:
 *         description: Données invalides ou erreur de validation
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
 *                   example: "Erreur de validation des données"
 *                 errors:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       field:
 *                         type: string
 *                         example: "firstName"
 *                       message:
 *                         type: string
 *                         example: "Le prénom doit contenir entre 2 et 50 caractères"
 *             examples:
 *               validation_errors:
 *                 summary: "Erreurs de validation multiples"
 *                 value:
 *                   success: false
 *                   message: "Erreur de validation des données"
 *                   errors:
 *                     - field: "firstName"
 *                       message: "Le prénom ne peut contenir que des lettres"
 *                     - field: "phoneNumber"
 *                       message: "Format de téléphone invalide"
 *                     - field: "postalCode"
 *                       message: "Le code postal doit contenir exactement 5 chiffres"
 *               empty_body:
 *                 summary: "Corps de requête vide"
 *                 value:
 *                   success: false
 *                   message: "Aucune donnée à mettre à jour fournie"
 *       401:
 *         description: Non authentifié - Token manquant ou invalide
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
 *             examples:
 *               no_token:
 *                 summary: "Token manquant"
 *                 value:
 *                   success: false
 *                   message: "Token d'authentification requis"
 *               invalid_token:
 *                 summary: "Token invalide"
 *                 value:
 *                   success: false
 *                   message: "Token invalide ou expiré"
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
 *                   example: "Erreur lors de la mise à jour du profil"
 *             example:
 *               success: false
 *               message: "Erreur lors de la mise à jour du profil"
 */
router.patch(
  "/users/me",
  validate({ schema: userSchema.partial(), skipSave: true }),
  verifyToken,
  updateCurrentUser
);

/**
 * @swagger
 * /users/me:
 *   delete:
 *     summary: Supprime l'utilisateur connecté
 *     tags:
 *       - Utilisateurs
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Utilisateur supprimé avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 message: "user deleted successfully"
 *                 success: true
 *       500:
 *         description: Erreur interne du serveur
 */
router.delete("/users/me", verifyToken, deleteUser);

/**
 * @swagger
 * /users/{id}:
 *   delete:
 *     summary: Supprime un utilisateur par son ID (admin seulement)
 *     tags:
 *       - Utilisateurs
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           example: "64f2c5e7b5e7e72f12345678"
 *         description: ID de l'utilisateur à supprimer
 *     responses:
 *       200:
 *         description: Utilisateur supprimé avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 message: "User deleted successfully"
 *                 user:
 *                   id: "64f2c5e7b5e7e72f12345678"
 *                   email: "john@example.com"
 *                   role: "user"
 *       404:
 *         description: Utilisateur non trouvé
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 success: false
 *                 message: "Utilisateur non trouvé"
 *       500:
 *         description: Erreur interne du serveur
 */
router.delete("/:id", verifyToken, verifyAdmin, deleteUserById);

export default router;
