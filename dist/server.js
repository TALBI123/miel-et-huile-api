"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("./config/passport");
const app_1 = __importDefault(require("./app"));
const emailService_service_1 = require("./services/emailService.service");
const client_1 = require("@prisma/client");
const PORT = process.env.PORT || 3000;
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
        const prisma = new client_1.PrismaClient();
        await prisma.$connect();
        console.log("✅ Connexion à la base de données réussie");
        await prisma.$disconnect();
        return true;
    }
    catch (error) {
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
    if ((0, emailService_service_1.verifyEmailConfig)()) {
        console.log("🔄 Checking SendGrid connection...");
        const isConnected = await (0, emailService_service_1.verifySendGridConnection)();
        if (isConnected) {
            console.log("🎉 SendGrid is properly configured and connected!");
        }
        else {
            console.warn("⚠️  SendGrid connection failed. Emails may not be sent.");
        }
    }
    else {
        console.warn("⚠️  Email service not configured - skipping connection test");
    }
};
if (process.env.NODE_ENV !== "test") {
    checkEmailConnection();
}
app_1.default.get('/', async (req, res) => {
    res.json({
        message: "Server is running updated",
        env: process.env.NODE_ENV || "❌ NODE_ENV non défini",
    });
});
const HOST = process.env.NODE_ENV === "production" ? "0.0.0.0" : "localhost";
app_1.default.listen(Number(PORT), HOST, () => {
    console.log(process.env.NODE_ENV || "❌ NODE_ENV non défini");
    console.log(`✅ Server running on http://${HOST}:${PORT}`);
});
//# sourceMappingURL=server.js.map