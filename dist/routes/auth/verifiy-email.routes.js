"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const verifyEmail_controller_1 = require("../../controller/auth/verifyEmail.controller");
const route = (0, express_1.Router)();
/**
 * @swagger
 * /auth/verify-email:
 *   get:
 *     summary: Vérifie l'email d'un utilisateur à partir du token reçu par email
 *     tags:
 *       - Auth
 *     parameters:
 *       - in: query
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *           example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *         description: Token de vérification envoyé par email
 *     responses:
 *       200:
 *         description: Email vérifié avec succès, page HTML renvoyée
 *         content:
 *           text/html:
 *             schema:
 *               type: string
 *               example: "<!DOCTYPE html> ... Page HTML de confirmation ..."
 *       400:
 *         description: Token manquant ou expiré
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               examples:
 *                 missingToken:
 *                   value:
 *                     message: "Le token est requis"
 *                 expiredToken:
 *                   value:
 *                     message: "Token expiré"
 *       404:
 *         description: Token invalide (non trouvé)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 message: "Token invalide"
 *       500:
 *         description: Erreur interne du serveur
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 message: "Erreur serveur interne"
 */
route.get("/", verifyEmail_controller_1.verifyEmail);
exports.default = route;
//# sourceMappingURL=verifiy-email.routes.js.map