"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyEmail = void 0;
const helpers_1 = require("../../utils/helpers");
const http_status_codes_1 = require("http-status-codes");
const client_1 = require("@prisma/client");
const path_1 = __importDefault(require("path"));
const prisma = new client_1.PrismaClient();
const verifyEmail = async (req, res) => {
    try {
        const { token } = req.query;
        const rowFlow = decodeURIComponent(token);
        const hashedToken = (0, helpers_1.hashToken)(rowFlow);
        console.log("Token reçu :", token);
        if (!token) {
            return res
                .status(http_status_codes_1.StatusCodes.BAD_REQUEST)
                .json({ message: "Le token est requis" });
        }
        console.log("Recherche du token dans la base de données...");
        const verificationToken = await prisma.verificationTokens.findUnique({
            where: { token: hashedToken },
        });
        console.log(verificationToken, token);
        if (!verificationToken)
            return res
                .status(http_status_codes_1.StatusCodes.NOT_FOUND)
                .json({ message: "Token invalide" });
        if ((0, helpers_1.isExpired)(verificationToken.expiresAt)) {
            await prisma.user.delete({ where: { id: verificationToken.userId } });
            return res
                .status(http_status_codes_1.StatusCodes.BAD_REQUEST)
                .json({ message: "Token expiré" });
        }
        await prisma.$transaction([
            prisma.user.update({
                where: { id: verificationToken.userId },
                data: { isVerified: true },
            }),
            prisma.verificationTokens.delete({
                where: { token: verificationToken.token },
            }),
        ]);
        res.sendFile(path_1.default.join(__dirname, "../../../views/verified-email.html"));
    }
    catch (err) {
        console.error("Erreur lors de la vérification de l'email :", err);
        return res
            .status(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR)
            .json({ message: "Erreur serveur interne" });
    }
};
exports.verifyEmail = verifyEmail;
//# sourceMappingURL=verifyEmail.controller.js.map