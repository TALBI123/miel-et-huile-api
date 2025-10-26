"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const forgetPassword_routes_1 = __importDefault(require("./routes/auth/forgetPassword.routes"));
const verifiy_email_routes_1 = __importDefault(require("./routes/auth/verifiy-email.routes"));
const handleErrors_1 = require("./middlewares/handleErrors");
const authGoogle_routes_1 = __importDefault(require("./routes/auth/authGoogle.routes"));
const auth_routes_1 = __importDefault(require("./routes/auth/auth.routes"));
const categorys_routes_1 = __importDefault(require("./routes/categorys.routes"));
const webhook_routes_1 = __importDefault(require("./routes/webhook.routes"));
const product_routes_1 = __importDefault(require("./routes/product.routes"));
const checkout_routes_1 = __importDefault(require("./routes/checkout.routes"));
const swagger_1 = require("./config/swagger");
const order_routes_1 = __importDefault(require("./routes/order.routes"));
const user_routes_1 = __importDefault(require("./routes/user.routes"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const app = (0, express_1.default)();
// app.use(cors({ origin: "http://domain:5173", credentials: true }));
app.use((0, cors_1.default)({ origin: true, credentials: true }));
// ⚠️ IMPORTANT: Les webhooks doivent être AVANT express.json()
app.use("/api/webhooks", webhook_routes_1.default);
// middleware pckages
app.use(express_1.default.static("view"));
app.use(express_1.default.json());
app.use((0, cookie_parser_1.default)());
// Connect to Redis
// connectRedis().catch((err) => {
//   console.error("❌ Unable to connect to Redis:", err);
// });
// Routes
// ---- AUth
app.use("/api/auth/verify-email", verifiy_email_routes_1.default);
app.use("/api/auth/google", authGoogle_routes_1.default);
app.use("/api/auth", auth_routes_1.default);
app.use("/api/auth", forgetPassword_routes_1.default);
// ---- API
app.use("/api/categorys", categorys_routes_1.default);
app.use("/api/products", product_routes_1.default);
app.use("/api/orders", order_routes_1.default);
app.use("/api", user_routes_1.default);
// --- Checkout & Payment
app.use("/api/checkout", checkout_routes_1.default);
// ---- Error Handler
app.use(handleErrors_1.errorHandler);
// Swagger Documentation
(0, swagger_1.setupSwagger)(app);
// Route de débogage pour vérifier les variables d'environnement Google OAuth
// Test .env Production
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
console.log("🔍 Vérification des variables d'environnement Google OAuth:");
console.log(" - GOOGLE_CLIENT_SECRET:", process.env.GOOGLE_CLIENT_SECRET ? "✅ Défini" : "❌ Manquant");
console.log(" - STRIPE_SECRET_KEY:", process.env.STRIPE_SECRET_KEY ? "✅ Défini" : "❌ Manquant");
console.log(" - STRIPE_PUBLIC_KEY:", process.env.STRIPE_PUBLIC_KEY ? "✅ Défini" : "❌ Manquant");
console.log(process.env.PORT || "❌ PORT non défini");
// async function runPacklink() {
//   console.log("🚀 Test de Packlink...");
//   await PacklinkService.testPacklink();
//   console.log("🔍 Vérification du statut Packlink:");
//   await PacklinkService.getStatus();
// }
// runPacklink()
exports.default = app;
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
//# sourceMappingURL=app.js.map