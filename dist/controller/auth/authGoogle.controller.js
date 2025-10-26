"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.googleCallback = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const helpers_1 = require("../../utils/helpers");
const getCallbackURL = () => {
    return process.env.NODE_ENV === "development"
        ? process.env.FRONTEND_LOCAL_URL
        : process.env.FRONTEND_PROD_URL;
};
const googleCallback = (req, res) => {
    try {
        const googleUser = req.user;
        console.log("Google User:", googleUser);
        if (!googleUser)
            return res.redirect(`${process.env.FRONTEND_URL}`);
        const token = jsonwebtoken_1.default.sign(googleUser, process.env.JWT_SECRET, {
            expiresIn: "24h",
        });
        console.log(googleUser, token);
        // Configeration du cookie
        res.cookie("access_token", token, {
            httpOnly: true,
            sameSite: "lax",
            secure: process.env.NODE_ENV === "production",
            maxAge: 24 * 60 * 60 * 1000,
        });
        // ✅ Redirection avec token dans l'URL (hash ou query)
        res.redirect(`${getCallbackURL()}`);
    }
    catch (err) {
        console.error(err);
        (0, helpers_1.handleServerError)(res, err);
    }
};
exports.googleCallback = googleCallback;
//# sourceMappingURL=authGoogle.controller.js.map