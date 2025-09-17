import googleAuth from "./routes/auth/authGoogle.route";
import verifyEmail from "./routes/auth/verifiy-email";
import loginRegister from "./routes/auth/auth.route";
import categoryRoute from "./routes/categorys.route";
import productRoute from "./routes/product.route";
// import { transporter } from "./utils/mailer";
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

if (fs.existsSync(".env")) {
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
// transporter
//   .verify()
//   .then(() => console.log("✅ Server nodemailer ready to take our messages"))
//   .catch((err) => console.error("❌ Server not ready:", err));

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

app.get("/", async (req, res) => {
  res.json({
    message: "Server is running updated",
    env: process.env.NODE_ENV,
    // Utilisez directement les variables système
    emailUser: process.env.EMAIL_USER || "NON DÉFINI",
    sendgridKey: process.env.SENDGRID_API_KEY ? "DÉFINI" : "NON DÉFINI",
    port: process.env.PORT,
    // Vérifiez d'autres variables importantes
    databaseUrl: process.env.DATABASE_URL ? "DÉFINI" : "NON DÉFINI",
  });
});
app.listen(Number(PORT), () => {
  console.log(`http://localhost:${PORT}`);
});
