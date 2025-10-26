"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const authGoogle_controller_1 = require("../../controller/auth/authGoogle.controller");
const express_1 = require("express");
const passport_1 = __importDefault(require("passport"));
const router = (0, express_1.Router)();
router.use(passport_1.default.initialize());
// Route pour démarrer l'authentification Google
router.get("/", passport_1.default.authenticate("google", { scope: ["profile", "email"] }));
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
router.get("/callback", passport_1.default.authenticate("google", { session: false }), authGoogle_controller_1.googleCallback);
// Route de callback modifiée
exports.default = router;
//# sourceMappingURL=authGoogle.routes.js.map