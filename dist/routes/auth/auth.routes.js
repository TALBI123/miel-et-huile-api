"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const auth_controller_1 = require("../../controller/auth/auth.controller");
const auth_schema_1 = require("../../schema/auth.schema");
const validate_1 = require("../../middlewares/validate");
const express_1 = require("express");
const router = (0, express_1.Router)();
/**
 * @swagger
 * tags:
 *   - name: Auth
 *     description: Gestion de l'inscription, connexion, déconnexion, vérification d'email et réinitialisation du mot de passe
 */
/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Connexion d'un utilisateur
 *     tags:
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 example: "john@example.com"
 *               password:
 *                 type: string
 *                 example: "Password123!"
 *     responses:
 *       200:
 *         description: Connexion réussie
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 message: "Connexion réussie"
 *                 success: true
 *                 date: "2025-09-23T18:00:00Z"
 *       401:
 *         description: Email ou mot de passe incorrect
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 success: false
 *                 message: "email ou mot de passe est incorrecte"
 *       403:
 *         description: Email non vérifié
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 success: false
 *                 message: "Veuillez confirmer votre email avant de vous connecter."
 *       500:
 *         description: Erreur interne du serveur
 */
router.post("/login", (0, validate_1.validate)({ schema: auth_schema_1.authSchema.pick({ email: true, password: true }) }), auth_controller_1.login);
/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Inscription d'un nouvel utilisateur
 *     tags:
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - firstName
 *               - lastName
 *               - email
 *               - password
 *             properties:
 *               firstName:
 *                 type: string
 *                 example: "John"
 *               lastName:
 *                 type: string
 *                 example: "Doe"
 *               email:
 *                 type: string
 *                 example: "john@example.com"
 *               password:
 *                 type: string
 *                 example: "Password123!"
 *     responses:
 *       201:
 *         description: Inscription réussie, email de vérification envoyé
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 message: "Inscription réussie. Veuillez vérifier votre email"
 *                 success: true
 *       400:
 *         description: Email déjà existant
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 message: "l email deja existe"
 *                 success: false
 *       500:
 *         description: Erreur interne du serveur
 */
router.post("/register", (0, validate_1.validate)({ schema: auth_schema_1.authSchema }), auth_controller_1.register);
/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: Déconnexion de l'utilisateur connecté
 *     tags:
 *       - Auth
 *     responses:
 *       200:
 *         description: Déconnexion réussie
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 success: true
 *                 message: "Déconnexion réussie"
 *                 toeknExpiration: "2025-09-23T19:00:00Z"
 *       500:
 *         description: Erreur interne du serveur
 */
router.get("/logout", auth_controller_1.logout);
exports.default = router;
//# sourceMappingURL=auth.routes.js.map