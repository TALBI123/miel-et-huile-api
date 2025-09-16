import nodemailer from "nodemailer";
import ejs from "ejs";
import path from "path";
import { MailOptions } from "../types/type";
import { config } from "dotenv";
config();
type PlainObject = { [key: string]: any };
export const transporter = nodemailer.createTransport({
  host: "smtp-relay.brevo.com",
  port: 587,
  auth: {
    user: "972e8f001@smtp-brevo.com", // toujours "apikey"
    pass: process.env.BERVE_API_KEY, // ta clé API SendGrid
  },
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
    console.log(process.env.EMAIL_USER);
    console.log(process.env.EMAIL_PASS);
    console.log(process.env.EMAIL_SERVICE);
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
