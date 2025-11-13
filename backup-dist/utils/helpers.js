"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.timeAgo = exports.cleanUploadedFiles = exports.handleServerError = exports.createVerificationToken = exports.generateSlug = exports.generateToken = exports.hashToken = exports.getExpirationDate = void 0;
exports.isExpired = isExpired;
const http_status_codes_1 = require("http-status-codes");
const client_1 = require("@prisma/client");
const crypto_1 = __importDefault(require("crypto"));
const slugify_1 = __importDefault(require("slugify"));
const fs_1 = __importDefault(require("fs"));
const prisma = new client_1.PrismaClient();
const getExpirationDate = (minutes) => {
    return new Date(Date.now() + minutes * 60 * 1000);
};
exports.getExpirationDate = getExpirationDate;
const hashToken = (token) => {
    // SHA-256 hex, suffit si stocké seul. Pour plus de sécurité, utiliser HMAC avec secret.
    return crypto_1.default
        .createHmac("sha256", process.env.SECRET_KEY)
        .update(token)
        .digest("base64url");
};
exports.hashToken = hashToken;
const generateToken = (len = 32) => {
    // retourne base64url pour être safe dans les URL
    return crypto_1.default.randomBytes(len).toString("base64url");
};
exports.generateToken = generateToken;
const generateSlug = (name, isLower = true) => {
    return (0, slugify_1.default)(name, { lower: isLower, strict: true });
};
exports.generateSlug = generateSlug;
function isExpired(date) {
    return date.getTime() < Date.now();
}
const createVerificationToken = async (userId, token, type, expiresInMinutes = 17) => {
    const expiresAt = (0, exports.getExpirationDate)(expiresInMinutes);
    const hashedToken = (0, exports.hashToken)(token);
    console.log(hashedToken);
    await prisma.verificationTokens.create({
        data: {
            token: hashedToken,
            userId,
            type,
            expiresAt,
        },
    });
    return token;
};
exports.createVerificationToken = createVerificationToken;
const handleServerError = (res, error) => {
    if (error instanceof Error)
        console.error(`Server error: ${http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR}`, error.message, error);
    else
        console.error(`------> Server error : ${http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR}`, error, {
            api_key: process.env.SENDGRID_API_KEY,
        });
    res.status(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: "Erreur serveur",
        error,
    });
};
exports.handleServerError = handleServerError;
const cleanUploadedFiles = (files) => {
    files.forEach((file) => {
        if (fs_1.default.existsSync(file.path))
            fs_1.default.unlinkSync(file.path);
    });
};
exports.cleanUploadedFiles = cleanUploadedFiles;
const timeAgo = (dateString) => {
    const date = new Date(dateString);
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    if (seconds < 60)
        return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60)
        return `${minutes}m:${seconds % 60}s ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24)
        return `${hours}h:${minutes % 60}m ago`;
    const days = Math.floor(hours / 24);
    if (days < 30)
        return `${days}d:${hours % 24}h ago`;
    const months = Math.floor(days / 30);
    if (months < 12)
        return `${months}mo:${days % 30}d ago`;
    const years = Math.floor(months / 12);
    return `${years}y ago`;
};
exports.timeAgo = timeAgo;
//# sourceMappingURL=helpers.js.map