import { Router } from "express";
import {
  deleteUser,
  deleteUserById,
  getAllUsers,
  getCurrentUser,
  getProffile,
} from "../controller/user.controller";
import { verifyAdmin, verifyToken } from "../middlewares/auth";
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
