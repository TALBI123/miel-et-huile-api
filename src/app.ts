import googleAuth from "./routes/auth/authGoogle.route";
import verifyEmail from "./routes/auth/verifiy-email";
import loginRegister from "./routes/auth/auth.route";
import categoryRoute from "./routes/categorys.route";
import productRoute from "./routes/product.route";
import { transporter } from "./utils/mailer";
// import { connectRedis } from "./config/cache";
import cookieParser from "cookie-parser";
import { config } from "dotenv";
import express from "express";
import cors from "cors";
// import "./config/passport";
const PORT = process.env.PORT || 4000;
const app = express();
app.use(cors({ origin: true, credentials: true }));
import fs from "fs"; // Importez le module 'fs' pour vérifier si le fichier existe
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
// Création dynamique du .env en production
if (process.env.NODE_ENV === "production" && !fs.existsSync(".env")) {
  try {
    const envContent = `
NODE_ENV=production
PORT=${process.env.PORT || 4000}
EMAIL_USER=${process.env.EMAIL_USER || ""}
EMAIL_PASS=${process.env.EMAIL_PASS || ""}
JWT_SECRET=${process.env.JWT_SECRET || "json_web_token_jwt"}
JWT_EXPIRES_IN=${process.env.JWT_EXPIRES_IN || "1h"}
DATABASE_URL=${process.env.DATABASE_URL || ""}
DIRECT_URL=${process.env.DIRECT_URL || ""}
SALT_ROUND=${process.env.SALT_ROUND || "11"}
FRONTEND_URL=${process.env.FRONTEND_URL || "http://localhost:5173"}
CLOUDINARY_CLOUD_NAME=${process.env.CLOUDINARY_CLOUD_NAME || ""}
CLOUDINARY_API_KEY=${process.env.CLOUDINARY_API_KEY || ""}
CLOUDINARY_API_SECRET=${process.env.CLOUDINARY_API_SECRET || ""}
GOOGLE_CLIENT_ID=${process.env.GOOGLE_CLIENT_ID || ""}
GOOGLE_CLIENT_SECRET=${process.env.GOOGLE_CLIENT_SECRET || ""}
CLIENT_URL=${process.env.CLIENT_URL || "http://localhost:5473"}
SENDGRID_API_KEY=${process.env.SENDGRID_API_KEY || ""}
BERVE_API_KEY=${process.env.BERVE_API_KEY || ""}
REDIS_URL=${process.env.REDIS_URL || ""}
    `.trim();

    fs.writeFileSync(".env", envContent);
    console.log("✅ Fichier .env créé dynamiquement pour la production");
  } catch (error) {
    console.error("❌ Erreur lors de la création du .env:", error);
  }
}

if (fs.existsSync(".env") && process.env.NODE_ENV !== "production") {
  config();
  console.log("Variables .env chargées pour le développement local");
} else {
  console.log(
    "Mode Production: Les variables d'environnement système sont utilisées"
  );
}

// middleware pckages
app.use(express.static("view"));
app.use(express.json());
app.use(cookieParser());

// Connect to nodeMailer
transporter
  .verify()
  .then(() => console.log("✅ Server nodemailer ready to take our messages"))
  .catch((err) => console.error("❌ Server not ready transport sendEmail:", err));

// Connect to Redis
// connectRedis().catch((err) => {
//   console.error("❌ Unable to connect to Redis:", err);
// });

// Routes
app.use("/", googleAuth);
app.use("/", loginRegister);
app.use("/", verifyEmail);
app.use("/categorys", categoryRoute);
app.use("/products", productRoute);
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
app.get("/db", async (req, res) => {
  const data = await prisma.user.findMany();
  res.status(200).json({ message: "db connected", data });
});
app.get("/", async (req, res) => {
  res.json({
    message: "Server is running updated",
    env: process.env.NODE_ENV || "❌ NODE_ENV non défini",

    allEnv: Object.keys(process.env)
      .filter((k) =>
        [
          "SENDGRID_API_KEY",
          "EMAIL_USER",
          "PORT",
          "DATABASE_URL",
          "DIRECT_URL",
        ].includes(k)
      )
      .reduce((acc, key) => ({ ...acc, [key]: process.env[key] }), {}),
  });
});
// ✅ NOUVEAU CODE (POUR RAILWAY) :

const HOST = process.env.NODE_ENV === 'production' ? '0.0.0.0' : 'localhost';
app.listen(Number(PORT), HOST, () => {
  console.log(process.env.NODE_ENV || "❌ NODE_ENV non défini");
  console.log(`✅ Server running on http://${HOST}:${PORT}`);
});
