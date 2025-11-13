"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyAdmin = exports.verifyToken = void 0;
const blacklistService_service_1 = require("../services/blacklistService.service");
const http_status_codes_1 = require("http-status-codes");
const enums_1 = require("../types/enums");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const blacklistService = new blacklistService_service_1.BlacklistService();
const verifyToken = (req, res, next) => {
    // console.log(req.cookies," from auth middleware");
    const token = req.cookies?.access_token;
    if (!token)
        return res.status(http_status_codes_1.StatusCodes.UNAUTHORIZED).json({
            success: false,
            message: "Accès non autorisé - Token manquant",
        });
    try {
        if (blacklistService.isTokenBlacklisted(token))
            return res.status(http_status_codes_1.StatusCodes.UNAUTHORIZED).json({
                success: false,
                message: "Accès non autorisé - Token blacklisté",
            });
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        req.user = decoded; // TypeScript reconnaîtra maintenant req.user
        next();
    }
    catch (err) {
        return res
            .status(http_status_codes_1.StatusCodes.UNAUTHORIZED)
            .json({ success: false, message: "Token invalide ou expiré" });
    }
};
exports.verifyToken = verifyToken;
const verifyAdmin = (req, res, next) => {
    // console.log(" Accès refusé - Vous n'êtes pas administrateur "+req.user);
    if (req.user?.role !== enums_1.ROLE.ADMIN) {
        return res.status(http_status_codes_1.StatusCodes.FORBIDDEN).json({
            success: false,
            message: "Accès refusé - Vous n'êtes pas administrateur",
            user: req.user
        });
    }
    next();
};
exports.verifyAdmin = verifyAdmin;
//# sourceMappingURL=auth.js.map