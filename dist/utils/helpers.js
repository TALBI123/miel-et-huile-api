"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleServerError = exports.createVerificationToken = exports.getExpirationDate = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const crypto_1 = __importDefault(require("crypto"));
const http_status_codes_1 = require("http-status-codes");
// interface ValidationError {
//   type: "field" | "alternative" | "alternative-grouped" | "unknown";
//   value: any;
//   msg: string;
//   path: string;
//   location: "body" | "cookies" | "headers" | "params" | "query";
// }
const getExpirationDate = (minutes) => {
    return new Date(Date.now() + minutes * 60 * 1000);
};
exports.getExpirationDate = getExpirationDate;
const createVerificationToken = async (userId, type, expiresInMinutes = 3) => {
    const token = crypto_1.default.randomBytes(16).toString();
    const expiresAt = (0, exports.getExpirationDate)(expiresInMinutes);
    await prisma.verificationTokens.create({
        data: {
            token,
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
        console.error(`Server error: ${http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR}`, error.message);
    else
        console.error(`Server error: ${http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR}`, error);
    res
        .status(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR)
        .json({ success: false, message: "Erreur serveur" });
};
exports.handleServerError = handleServerError;
// const UniquerErors = (arr: ValidationError[]) => {
// };
// export {UniquerErors}
//# sourceMappingURL=helpers.js.map