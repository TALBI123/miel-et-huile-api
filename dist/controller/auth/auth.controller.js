"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logout = exports.login = exports.register = void 0;
const blacklistService_service_1 = require("../../services/blacklistService.service");
const emailService_service_1 = require("../../services/emailService.service");
const enums_1 = require("../../types/enums");
const http_status_codes_1 = require("http-status-codes");
const client_1 = require("@prisma/client");
const dotenv_1 = require("dotenv");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const blacklistService = new blacklistService_service_1.BlacklistService();
const helpers_1 = require("../../utils/helpers");
(0, dotenv_1.config)();
const prisma = new client_1.PrismaClient();
const register = async (req, res) => {
    console.log("est deja");
    const { firstName, lastName, email, password } = req.body;
    try {
        const data = await prisma.user.findUnique({
            where: { email },
            select: { email: true },
        });
        if (data?.email)
            return res
                .status(http_status_codes_1.StatusCodes.BAD_REQUEST)
                .json({ message: "l email deja existe", success: false });
        const hash = await bcryptjs_1.default.hash(password, +process.env.SALT_ROUND || 10);
        const token = (0, helpers_1.generateToken)();
        const link = `${process.env.NODE_ENV === "production"
            ? process.env.BACKEND_URL
            : process.env.LOCAL_URL}/api/auth/verify-email?token=${encodeURIComponent(token)}`;
        const user = await prisma.user.create({
            data: {
                firstName,
                lastName,
                email,
                password: hash,
                termsAccepted: true,
            },
            select: { id: true },
        });
        await (0, helpers_1.createVerificationToken)(user.id, token, enums_1.VerificationTokenType.EMAIL_VERIFICATION, 15);
        const emailOptions = {
            to: email,
            subject: "verification de votre email",
            htmlFileName: "verification.email.ejs",
            context: { link },
        };
        await (0, emailService_service_1.sendEmail)(emailOptions);
        console.log(token, new Date());
        res.status(http_status_codes_1.StatusCodes.CREATED).json({
            message: "Inscription réussie. Veuillez vérifier votre email",
            success: true,
        });
    }
    catch (err) {
        (0, helpers_1.handleServerError)(res, err);
    }
};
exports.register = register;
const login = async (req, res) => {
    const { email, password } = req.body;
    const data = await prisma.user.findUnique({
        where: { email },
        select: {
            id: true,
            email: true,
            password: true,
            role: true,
            isVerified: true,
        },
    });
    if (!data?.email)
        return res.status(http_status_codes_1.StatusCodes.UNAUTHORIZED).json({
            success: false,
            message: "email ou mot de passe est incorrecte",
        });
    if (!data.isVerified)
        return res.status(http_status_codes_1.StatusCodes.FORBIDDEN).json({
            success: false,
            message: "Veuillez confirmer votre email avant de vous connecter.",
        });
    try {
        const isPasswordValid = await bcryptjs_1.default.compare(password, data.password);
        if (!isPasswordValid)
            return res.status(http_status_codes_1.StatusCodes.UNAUTHORIZED).json({
                success: false,
                message: "email ou mot de passe est incorrecte",
            });
        // Generation de JWT
        const payload = {
            id: data.id,
            email: data.email,
            role: data.role,
        };
        const token = jsonwebtoken_1.default.sign(payload, process.env.JWT_SECRET, {
            expiresIn: "24h",
        });
        // Configeration du cookie
        res.cookie("access_token", token, {
            httpOnly: true,
            sameSite: "none",
            secure: true,
            maxAge: 24 * 60 * 60 * 1000,
        });
        return res
            .status(http_status_codes_1.StatusCodes.OK)
            .json({ message: "Connexion réussie", success: true, date: new Date() });
    }
    catch (err) {
        (0, helpers_1.handleServerError)(res, err);
    }
};
exports.login = login;
const logout = async (req, res) => {
    try {
        const token = req.cookies["access_token"];
        if (token) {
            try {
                blacklistService.addToBlacklist(token);
            }
            catch (err) {
                console.error("Erreur lors de l'ajout du token à la blacklist:", err);
            }
        }
        res.clearCookie("access_token", {
            path: "/",
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            domain: process.env.COOKIE_DOMAIN || undefined,
        });
        res.status(http_status_codes_1.StatusCodes.OK).json({
            success: true,
            message: "Déconnexion réussie",
            toeknExpiration: (0, helpers_1.getExpirationDate)(token),
        });
    }
    catch (err) {
        (0, helpers_1.handleServerError)(res, err);
    }
};
exports.logout = logout;
//# sourceMappingURL=auth.controller.js.map