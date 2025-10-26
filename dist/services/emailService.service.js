"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyEmailConfig = exports.testEmailConnection = exports.verifySendGridConnection = exports.sendEmail = void 0;
const mail_1 = __importDefault(require("@sendgrid/mail"));
const ejs_1 = __importDefault(require("ejs"));
const path_1 = __importDefault(require("path"));
// Type guard pour vérifier le type d'erreur SendGrid
function isSendGridError(error) {
    return error && typeof error === "object" && "response" in error;
}
// Configuration SendGrid
if (!process.env.SENDGRID_API_KEY) {
    console.warn("⚠️  SENDGRID_API_KEY is not defined");
}
else {
    mail_1.default.setApiKey(process.env.SENDGRID_API_KEY);
}
const sendEmail = async ({ to, subject, htmlFileName, context, }) => {
    try {
        console.log("📧 Attempting to send email to:", to);
        // Vérification des variables requises
        if (!process.env.SENDGRID_API_KEY) {
            throw new Error("SENDGRID_API_KEY is not defined in environment variables");
        }
        if (!process.env.EMAIL_USER) {
            throw new Error("EMAIL_USER is not defined in environment variables");
        }
        // Rendu du template EJS
        const templateFile = path_1.default.join(__dirname, `../../views/${htmlFileName}`);
        console.log("📄 Using template:", templateFile);
        const htmlContent = await ejs_1.default.renderFile(templateFile, context || {});
        // Configuration du message SendGrid
        const msg = {
            to: Array.isArray(to) ? to : [to],
            from: process.env.EMAIL_USER,
            subject,
            html: htmlContent,
        };
        console.log("🔄 Sending email via SendGrid...");
        const response = await mail_1.default.send(msg);
        console.log("✅ Email sent successfully. Status:", response[0].statusCode);
    }
    catch (error) {
        console.error("❌ SendGrid error details:");
        console.error("Error name:", error.name);
        console.error("Error message:", error.message);
        if (isSendGridError(error)) {
            console.error("Error code:", error.code);
            if (error.response) {
                console.error("Status code:", error.response.statusCode);
                console.error("Error response body:", error.response.body);
            }
        }
        throw new Error(`Email sending failed: ${error.message}`);
    }
};
exports.sendEmail = sendEmail;
const verifySendGridConnection = async () => {
    try {
        console.log("🔍 Testing SendGrid connection (like transporter.verify())...");
        // Méthode 1: Envoyer un email test vide (équivalent à verify)
        const testMsg = {
            to: "test@example.com",
            from: process.env.EMAIL_USER,
            subject: "Sandbox Test",
            text: "Ceci est un test sandbox",
            mailSettings: {
                sandboxMode: {
                    enable: true, // ✅ n’enverra pas l’email
                },
            },
        };
        // Cette instruction va tester l'authentification et la connexion
        const response = await mail_1.default.send(testMsg);
        console.log("Sandbox response status:", response[0].statusCode);
        console.log("✅ SendGrid connection verified successfully!");
        return true;
    }
    catch (error) {
        console.error("❌ SendGrid connection verification failed:", error.message);
        if (isSendGridError(error)) {
            console.error("Error code:", error.code);
            if (error.response) {
                console.error("Status code:", error.response.statusCode);
                console.error("Error response:", JSON.stringify(error.response.body, null, 2));
            }
        }
        else {
            console.error("❌ Unknown error during connection verification:", error);
        }
        return false;
    }
};
exports.verifySendGridConnection = verifySendGridConnection;
// Fonction pour tester la connexion SendGrid
const testEmailConnection = async (testEmail = "test@example.com") => {
    try {
        if (!(0, exports.verifyEmailConfig)()) {
            throw new Error("Email service not configured");
        }
        console.log("🧪 Testing SendGrid connection...");
        const testMsg = {
            to: testEmail,
            from: process.env.EMAIL_USER,
            subject: "Test Connection - SendGrid",
            html: `
        <h1>Test de connexion SendGrid</h1>
        <p>Cet email confirme que votre configuration SendGrid fonctionne correctement.</p>
        <p>Timestamp: ${new Date().toISOString()}</p>
      `,
        };
        const response = await mail_1.default.send(testMsg);
        console.log("✅ SendGrid test successful. Status:", response[0].statusCode);
    }
    catch (error) {
        console.error("❌ SendGrid test failed:", error.message);
        if (isSendGridError(error) && error.response) {
            console.error("Error details:", error.response.body);
        }
        throw error;
    }
};
exports.testEmailConnection = testEmailConnection;
// Fonction de vérification de base
const verifyEmailConfig = () => {
    const hasApiKey = !!process.env.SENDGRID_API_KEY;
    const hasEmailUser = !!process.env.EMAIL_USER;
    return hasApiKey && hasEmailUser;
};
exports.verifyEmailConfig = verifyEmailConfig;
//# sourceMappingURL=emailService.service.js.map