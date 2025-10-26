"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resetPassword = exports.forgetPassword = void 0;
const emailService_service_1 = require("../../services/emailService.service");
const enums_1 = require("../../types/enums");
const client_1 = require("@prisma/client");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const helpers_1 = require("../../utils/helpers");
const prisma = new client_1.PrismaClient();
const forgetPassword = async (req, res) => {
    try {
        const { email } = req.body;
        const user = await prisma.user.findUnique({ where: { email } });
        if (user) {
            const token = (0, helpers_1.generateToken)();
            await (0, helpers_1.createVerificationToken)(user.id, token, enums_1.VerificationTokenType.PASSWORD_RESET, 5);
            console.log("Generated token:", token);
            const link = `${process.env.FRONTEND_URL}/reset-password?token=${encodeURIComponent(token)}`;
            await (0, emailService_service_1.sendEmail)({
                to: email,
                subject: "Réinitialisation du mot de passe",
                htmlFileName: "reset.password.ejs",
                context: {
                    link,
                },
            });
        }
        res.json({
            message: "If this email exists, you will receive a password reset link shortly.",
        });
    }
    catch (err) {
        console.error("forgotPassword error:", err);
        // Réponse générique
        res.status(500).json({ message: "An error occurred." });
    }
};
exports.forgetPassword = forgetPassword;
const resetPassword = async (req, res) => {
    try {
        const { token, newPassword } = req.body;
        const rowFlow = decodeURIComponent(token);
        // console.log("Decoded token:", rowFlow);
        const hashedToken = (0, helpers_1.hashToken)(rowFlow);
        // console.log("Received token:", hashedToken);
        const verificationToken = await prisma.verificationTokens.findUnique({
            where: { token: hashedToken },
        });
        if (!verificationToken)
            return res.status(400).json({ success: false, message: "Invalid or expired token" });
        if (verificationToken.type !== enums_1.VerificationTokenType.PASSWORD_RESET)
            return res.status(400).json({ success: false, message: "Invalid token type" });
        if ((0, helpers_1.isExpired)(verificationToken.expiresAt)) {
            await prisma.verificationTokens.delete({
                where: { token: verificationToken.token },
            });
            return res.status(400).json({ success: false, message: "Token has expired" });
        }
        const hashedPassword = await bcryptjs_1.default.hash(newPassword, 11);
        await prisma.$transaction([
            prisma.user.update({
                where: { id: verificationToken.userId },
                data: { password: hashedPassword },
            }),
            prisma.verificationTokens.delete({
                where: { token: verificationToken.token },
            }),
        ]);
        res.status(200).json({ success: true, message: "Password has been reset successfully" });
    }
    catch (err) {
        (0, helpers_1.handleServerError)(res, err);
    }
};
exports.resetPassword = resetPassword;
//# sourceMappingURL=forgetPassword.controller.js.map