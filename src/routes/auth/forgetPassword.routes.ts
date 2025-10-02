import {
  forgetPassword,
  resetPassword,
} from "../../controller/auth/forgetPassword.controller";
import { validate } from "../../middlewares/validate";
import {
  forgetPasswordSchema,
  resetPasswordSchema,
} from "../../schema/auth.schema";
import { Router } from "express";

const router = Router();
/**
 * @swagger
 * /auth/forgot-password:
 *   post:
 *     summary: Envoie un lien de réinitialisation du mot de passe à l'email fourni
 *     tags:
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "user@example.com"
 *                 description: L'email de l'utilisateur qui souhaite réinitialiser son mot de passe
 *     responses:
 *       200:
 *         description: Lien de réinitialisation envoyé si l'email existe
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 message: "If this email exists, you will receive a password reset link shortly."
 *       500:
 *         description: Erreur interne du serveur
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 message: "An error occurred."
 */

router.post(
  "/forgot-password",
  validate({ schema: forgetPasswordSchema }),
  forgetPassword
);

/**
 * @swagger
 * /auth/reset-password:
 *   post:
 *     summary: Réinitialise le mot de passe d'un utilisateur à partir du token
 *     tags:
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               token:
 *                 type: string
 *                 description: Token reçu par email pour la réinitialisation
 *                 example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *               newPassword:
 *                 type: string
 *                 description: Nouveau mot de passe
 *                 example: "NouveauMotDePasse123!"
 *     responses:
 *       200:
 *         description: Mot de passe réinitialisé avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 success: true
 *                 message: "Password has been reset successfully"
 *       400:
 *         description: Token invalide, expiré ou type incorrect
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               examples:
 *                 invalidToken:
 *                   value:
 *                     success: false
 *                     message: "Invalid or expired token"
 *                 invalidType:
 *                   value:
 *                     success: false
 *                     message: "Invalid token type"
 *                 expiredToken:
 *                   value:
 *                     success: false
 *                     message: "Token has expired"
 *       500:
 *         description: Erreur interne du serveur
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 message: "An error occurred."
 */
router.post(
  "/reset-password",
  validate({ schema: resetPasswordSchema }),
  resetPassword
);

export default router;
