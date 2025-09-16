import { createClient } from "redis";
const redisClient = createClient({ url: process.env.REDIS_URL });

redisClient.on("connect", () => {
  console.log("✅ Redis connected successfully");
});

redisClient.on("error", (err) => {
  console.error("❌ Redis connection error:", err);
});
export const connectRedis = async () => {
  try {
    await redisClient.connect();
    console.log("✅ Redis connection established");
  } catch (err) {
    console.error("❌ Failed to connect to Redis:", err);
    throw err; // Propager l'erreur pour la gérer plus haut
  }
};
export default redisClient;