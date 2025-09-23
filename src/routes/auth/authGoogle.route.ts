import { googleCallback } from "../../controller/auth/authGoogle.controller";
import { Router } from "express";
import passport from "passport";
const router = Router();
router.use(passport.initialize());
// Route pour démarrer l'authentification Google

router.get(
  "/",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

/**
 * @swagger
 * /auth/google/callback:
 *   get:
 *     summary: Callback après l'authentification Google OAuth2
 *     tags:
 *       - Auth
 *     description: >
 *       Cette route est utilisée comme callback par Google après que l'utilisateur
 *       se soit authentifié via OAuth2. Elle crée un JWT, le place dans un cookie
 *       HttpOnly, puis redirige l'utilisateur vers le frontend.
 *     responses:
 *       302:
 *         description: Redirection vers le frontend avec cookie JWT
 *       500:
 *         description: Erreur interne du serveur
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 message: "Erreur serveur interne"
 */
router.get(
  "/callback",
  passport.authenticate("google", { session: false }),
  googleCallback
);

// Route de callback modifiée

export default router;
