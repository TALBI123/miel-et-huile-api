import forgetPassword from "./routes/auth/forgetPassword";
import googleAuth from "./routes/auth/authGoogle.route";
import verifyEmail from "./routes/auth/verifiy-email";
import loginRegister from "./routes/auth/auth.route";
import categoryRoute from "./routes/categorys.route";
import productRoute from "./routes/product.route";
import cookieParser from "cookie-parser";
import express from "express";
import cors from "cors";
import { verifyToken } from "./middlewares/auth";
const app = express();
app.use(cors({ origin: true, credentials: true }));

// middleware pckages
app.use(express.static("view"));
app.use(express.json());
app.use(cookieParser());

// Connect to Redis
// connectRedis().catch((err) => {
//   console.error("❌ Unable to connect to Redis:", err);
// });

// Routes
app.use("/auth/google", googleAuth);
app.use("/", loginRegister);
app.use("/verify-email", verifyEmail);
app.use("/categorys", categoryRoute);
app.use("/products", productRoute);
app.use("/forget-password", forgetPassword)

// Route de débogage pour vérifier les variables d'environnement Google OAuth
app.get("/auth/google/debug", (req, res) => {
  res.json({
    clientId: process.env.GOOGLE_CLIENT_ID ? "✅ Défini" : "❌ Manquant",
    clientSecret: process.env.GOOGLE_CLIENT_SECRET
      ? "✅ Défini"
      : "❌ Manquant",
    callbackURL: process.env.GOOGLE_CALLBACK_URL ? "✅ Défini" : "❌ Manquant",
    environment: process.env.NODE_ENV,
    domain: process.env.DOMAIN,
  });
});
app.get('/me', verifyToken, (req, res) => {
  console.log(req.user);
  res.json({ message: `user info :  ${req.user?.email} - ` });
});
app.get("/ping", (req, res) => {
  res.json({ message: "pong" });
});

export default app;




// app.get("/", async (req, res) => {
//   res.json({
//     message: "Server is running updated",
//     env: process.env.NODE_ENV || "❌ NODE_ENV non défini",

//     allEnv: Object.keys(process.env)
//       .filter((k) =>
//         [
//           "GOOGLE_CLIENT_ID",
//           "GOOGLE_CLIENT_SECRET",
//           "GOOGLE_CALLBACK_URL",
//         ].includes(k)
//       )
//       .reduce((acc, key) => ({ ...acc, [key]: process.env[key] }), {}),
//   });
// });
// Création dynamique du .env en production
// if (process.env.NODE_ENV === "production" && !fs.existsSync(".env")) {
//   try {
//     const envContent = `
// NODE_ENV=production
// PORT=${process.env.PORT || 4000}
// EMAIL_USER=${process.env.EMAIL_USER || ""}
// EMAIL_PASS=${process.env.EMAIL_PASS || ""}
// JWT_SECRET=${process.env.JWT_SECRET || "json_web_token_jwt"}
// JWT_EXPIRES_IN=${process.env.JWT_EXPIRES_IN || "1h"}
// DATABASE_URL=${process.env.DATABASE_URL || ""}
// DIRECT_URL=${process.env.DIRECT_URL || ""}
// SALT_ROUND=${process.env.SALT_ROUND || "11"}
// FRONTEND_URL=${process.env.FRONTEND_URL || "http://localhost:5173"}
// CLOUDINARY_CLOUD_NAME=${process.env.CLOUDINARY_CLOUD_NAME || ""}
// CLOUDINARY_API_KEY=${process.env.CLOUDINARY_API_KEY || ""}
// CLOUDINARY_API_SECRET=${process.env.CLOUDINARY_API_SECRET || ""}
// GOOGLE_CLIENT_ID=${process.env.GOOGLE_CLIENT_ID || ""}
// GOOGLE_CLIENT_SECRET=${process.env.GOOGLE_CLIENT_SECRET || ""}
// CLIENT_URL=${process.env.CLIENT_URL || "http://localhost:5473"}
// SENDGRID_API_KEY=${process.env.SENDGRID_API_KEY || ""}
// BERVE_API_KEY=${process.env.BERVE_API_KEY || ""}
// REDIS_URL=${process.env.REDIS_URL || ""}
//     `.trim();

//     fs.writeFileSync(".env", envContent);
//     console.log("✅ Fichier .env créé dynamiquement pour la production");
//   } catch (error) {
//     console.error("❌ Erreur lors de la création du .env:", error);
//   }
// }
