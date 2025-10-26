"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cache = void 0;
// import { createClient } from "redis";
const node_cache_1 = __importDefault(require("node-cache"));
exports.cache = new node_cache_1.default({ stdTTL: 100, checkperiod: 120 });
// const redisClient = createClient({ url: process.env.REDIS_URL });
// redisClient.on("connect", () => {
//   console.log("✅ Redis connected successfully");
// });
// redisClient.on("error", (err) => {
//   console.error("❌ Redis connection error:", err);
// });
// export const connectRedis = async () => {
//   try {
//     await redisClient.connect();
//     console.log("✅ Redis connection established");
//   } catch (err) {
//     console.error("❌ Failed to connect to Redis:", err);
//     throw err; // Propager l'erreur pour la gérer plus haut
//   }
// };
// export default redisClient;
//# sourceMappingURL=cache.js.map