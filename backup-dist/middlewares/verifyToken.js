"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAuth = void 0;
const http_status_codes_1 = require("http-status-codes");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const requireAuth = (req, res, next) => {
    console.log(req);
    const token = req.cookies?.token;
    if (!token)
        return res.status(http_status_codes_1.StatusCodes.UNAUTHORIZED).json({
            success: false,
            message: "Accès non autorisé - Token manquant",
        });
    try {
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        // console.log(req.user)
        next();
    }
    catch (err) {
        return res
            .status(http_status_codes_1.StatusCodes.UNAUTHORIZED)
            .json({ success: false, message: "Token invalide ou expiré" });
    }
};
exports.requireAuth = requireAuth;
//# sourceMappingURL=verifyToken.js.map