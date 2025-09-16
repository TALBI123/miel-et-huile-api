import nodemailer from "nodemailer";
import ejs from "ejs";
import path from "path";
import { MailOptions } from "../types/type";
import { config } from "dotenv";
config();
type PlainObject = { [key: string]: any };
export const transporter = nodemailer.createTransport({
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
export const sendEmail = async <T extends PlainObject>({
  to,
  subject,
  htmlFileName,
  context,
}: MailOptions<T>) => {
  try {
    if (Array.isArray(context))
      throw new Error("Le contexte ne peut pas être un tableau");
    const templateFile = path.join(__dirname, `../../views/${htmlFileName}`);
    const html = await ejs.renderFile(templateFile, context || {});
    const info = await transporter.sendMail({
      from: `"Mon App" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    });
    console.log("Message sent: %s", info);
  } catch (err) {
    console.error("Erreur lors de l'envoi de l'email:", err);
    throw err;
  }
};
