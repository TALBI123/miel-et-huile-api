import jwt, { JwtPayload } from "jsonwebtoken";
import { cache } from "../config/cache";
import crypto from "crypto";

export class BlacklistService {
  addToBlacklist(token: string) {
    try {
      const decoded = jwt.decode(token) as JwtPayload;
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
      let cacheKey: string;
      if (decoded.jti && typeof decoded.jti === "string")
        cacheKey = `blacklist_${decoded.jti}`;
      else {
        const tokenHash = crypto
          .createHash("sha256")
          .update(token)
          .digest("hex");
        cacheKey = `blacklist_${tokenHash}`;
      }
      const ttl = Math.max(1, Math.floor(timeUntilExpiration / 1000));
      cache.set(cacheKey, true, ttl);
      console.log(`Token blacklisté pour ${ttl} secondes`);
    } catch (err) {
      console.error("Erreur lors de l'ajout à la blacklist:", err);
      throw new Error("Échec de la blacklist du token");
    }
  }
  isTokenBlacklisted(token: string) {
    try {
      const decoded = jwt.decode(token) as JwtPayload;
      if (!decoded) return false;
      let cacheKey: string;
      if (decoded.jti && typeof decoded.jti === "string")
        cacheKey = `blacklist_${decoded.jti}`;
      else {
        const tokenHash = crypto
          .createHash("sha256")
          .update(token)
          .digest("hex");
        cacheKey = `blacklist_${tokenHash}`;
      }
      return !!cache.get(cacheKey);
    } catch (err) {
      console.error("Erreur lors de la vérification de la blacklist:", err);
      return false;
    }
  }
  clearBlacklist() {
    cache.flushAll();
  }
}
