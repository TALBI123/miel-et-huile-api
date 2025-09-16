// import { createClient } from "redis";
import memoryCache from "node-cache";
import "dotenv/config";
export const cache = new memoryCache({ stdTTL: 100, checkperiod: 120 });
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
