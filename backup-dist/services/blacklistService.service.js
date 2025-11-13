"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BlacklistService = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const cache_1 = require("../config/cache");
const crypto_1 = __importDefault(require("crypto"));
class BlacklistService {
    addToBlacklist(token) {
        try {
            const decoded = jsonwebtoken_1.default.decode(token);
            if (!decoded || typeof decoded !== "object") {
                console.log("Invalid token format");
                return;
            }
            const expirationTime = decoded.exp
                ? decoded.exp * 1000
                : Date.now() + 24 * 60 * 60 * 1000;
            const timeUntilExpiration = expirationTime - Date.now();
            if (timeUntilExpiration <= 0) {
                console.log("Token déjà expiré, pas besoin de blacklist");
                return;
            }
            let cacheKey;
            if (decoded.jti && typeof decoded.jti === "string")
                cacheKey = `blacklist_${decoded.jti}`;
            else {
                const tokenHash = crypto_1.default
                    .createHash("sha256")
                    .update(token)
                    .digest("hex");
                cacheKey = `blacklist_${tokenHash}`;
            }
            const ttl = Math.max(1, Math.floor(timeUntilExpiration / 1000));
            cache_1.cache.set(cacheKey, true, ttl);
            console.log(`Token blacklisté pour ${ttl} secondes`);
        }
        catch (err) {
            console.error("Erreur lors de l'ajout à la blacklist:", err);
            throw new Error("Échec de la blacklist du token");
        }
    }
    isTokenBlacklisted(token) {
        try {
            const decoded = jsonwebtoken_1.default.decode(token);
            if (!decoded)
                return false;
            let cacheKey;
            if (decoded.jti && typeof decoded.jti === "string")
                cacheKey = `blacklist_${decoded.jti}`;
            else {
                const tokenHash = crypto_1.default
                    .createHash("sha256")
                    .update(token)
                    .digest("hex");
                cacheKey = `blacklist_${tokenHash}`;
            }
            return !!cache_1.cache.get(cacheKey);
        }
        catch (err) {
            console.error("Erreur lors de la vérification de la blacklist:", err);
            return false;
        }
    }
    clearBlacklist() {
        cache_1.cache.flushAll();
    }
}
exports.BlacklistService = BlacklistService;
//# sourceMappingURL=blacklistService.service.js.map