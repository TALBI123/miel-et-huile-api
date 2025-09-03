"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logout = exports.register = exports.login = void 0;
const client_1 = require("@prisma/client");
const http_status_codes_1 = require("http-status-codes");
const mailer_1 = require("../../utils/mailer");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const crypto_1 = __importDefault(require("crypto"));
const dotenv_1 = require("dotenv");
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
        console.log(client_1.VerificationTokenType);
        if (data?.email)
            return res
                .status(http_status_codes_1.StatusCodes.BAD_REQUEST)
                .json({ message: "l email deja existe", success: false });
        console.log(process.env.SALT_ROUND);
        const hash = await bcryptjs_1.default.hash(password, +process.env.SALT_ROUND || 10);
        const token = crypto_1.default.randomBytes(16).toString("hex");
        const link = `http://localhost:${process.env.PORT}/auth/verification-email?token=${token}`;
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
        await prisma.verificationTokens.create({
            data: {
                token,
                userId: user.id,
                type: client_1.VerificationTokenType.EMAIL_VERIFICATION,
                expiresAt: (0, helpers_1.getExpirationDate)(4),
            },
        });
        await (0, helpers_1.createVerificationToken)(user.id, client_1.VerificationTokenType.EMAIL_VERIFICATION);
        const emailOptions = {
            to: email,
            subject: "verifacation de l'eamil",
            htmlFileName: "verification.email.ejs",
            context: { link },
        };
        await (0, mailer_1.sendEmail)(emailOptions);
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
        const isPasswordValid = await bcryptjs_1.default.compare(password, data?.password);
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
            expiresIn: "1h",
        });
        // Configeration du cookie
        res.cookie("access_token", token, {
            httpOnly: true,
            sameSite: "lax",
            maxAge: 15 * 60 * 1000,
        });
        return res
            .status(http_status_codes_1.StatusCodes.OK)
            .json({ message: "Connexion réussie", success: true });
    }
    catch (err) {
        (0, helpers_1.handleServerError)(res, err);
    }
};
exports.login = login;
const logout = async (req, res) => {
    try {
        console.log("logout");
        res.status(http_status_codes_1.StatusCodes.OK).json({ message: "Logout" });
    }
    catch (err) {
        (0, helpers_1.handleServerError)(res, err);
    }
};
exports.logout = logout;
//# sourceMappingURL=auth.controller.js.map