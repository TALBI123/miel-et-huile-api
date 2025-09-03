"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendEmail = exports.transporter = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
const ejs_1 = __importDefault(require("ejs"));
const path_1 = __importDefault(require("path"));
exports.transporter = nodemailer_1.default.createTransport({
    service: process.env.EMAIL_SERVICE,
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
    pool: true,
    maxConnections: 5, // max connexions simultanées
    maxMessages: 100,
});
// transporter
//   .verify()
//   .then(() => console.log("✅ Server ready to take our messages"))
//   .catch((err) => console.error("❌ Server not ready:", err));
const sendEmail = async ({ to, subject, htmlFileName, context, }) => {
    try {
        if (Array.isArray(context))
            throw new Error("Le contexte ne peut pas être un tableau");
        const templateFile = path_1.default.join(__dirname, `../views/${htmlFileName}`);
        const html = await ejs_1.default.renderFile(templateFile, context);
        const info = exports.transporter.sendMail({
            from: `"Mon App" <${process.env.EMAIL_USER}>`,
            to,
            subject,
            html,
        });
    }
    catch (err) {
        console.error("Erreur lors de l'envoi de l'email:", err);
        throw err;
    }
};
exports.sendEmail = sendEmail;
//# sourceMappingURL=mailer.js.map