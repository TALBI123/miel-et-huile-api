// import { connectRedis } from "./config/cache";
import { config } from "dotenv"; 
import "./config/passport";
import app from "./app";
import fs from "fs";
import { Request, Response } from "express";
import {
  verifyEmailConfig,
  verifySendGridConnection,
} from "./services/emailService.service";
import { PrismaClient } from "@prisma/client";
const PORT = process.env.PORT || 8080;

// if (fs.existsSync(".env") && process.env.NODE_ENV !== "production") {
//   config();
//   console.log("Variables .env chargées pour le développement local");
// } else {
//   console.log(
//     "Mode Production: Les variables d'environnement système sont utilisées"
//   );
// }

async function checkConnection() {
  try {
    const prisma = new PrismaClient();
    await prisma.$connect();
    console.log("✅ Connexion à la base de données réussie");
    await prisma.$disconnect();
    return true;
  } catch (error) {
    console.error("❌ Erreur de connexion Prisma:", error);
    return false;
  }
}

checkConnection().then((success) => {
  if (!success) {
    console.log("❌ Arrêt du serveur - Base de données inaccessible");
    process.exit(1);
  }
});

// ✅ NOUVEAU CODE (POUR RAILWAY) :
const checkEmailConnection = async () => {
  if (verifyEmailConfig()) {
    console.log("🔄 Checking SendGrid connection...");
    const isConnected = await verifySendGridConnection();

    if (isConnected) {
      console.log("🎉 SendGrid is properly configured and connected!");
    } else {
      console.warn("⚠️  SendGrid connection failed. Emails may not be sent.");
    }
  } else {
    console.warn("⚠️  Email service not configured - skipping connection test");
  }
};
if (process.env.NODE_ENV !== "test") {
  checkEmailConnection();
}
app.get('/',async(req: Request, res: Response) => {
  res.json({
    message: "Server is running updated",
    env: process.env.NODE_ENV || "❌ NODE_ENV non défini",
  });
})
const HOST = process.env.NODE_ENV === "production" ? "0.0.0.0" : "localhost";
app.listen(Number(PORT), HOST, () => {
  console.log(process.env.NODE_ENV || "❌ NODE_ENV non défini");
  console.log('hi brooooooooooooooooooooo')
  console.log(`✅ Server running on http://${HOST}:${PORT}`);
});