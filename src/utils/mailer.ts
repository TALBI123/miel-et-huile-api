import nodemailer from "nodemailer";
import ejs from "ejs";
import path from "path";
import { MailOptions } from "../types/type";
type PlainObject = { [key: string]: any };
export const transporter = nodemailer.createTransport({
  host: "smtp.sendgrid.net",
  port: 587,
  auth: {
    user: "apikey", // toujours "apikey"
    pass: "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", // ta clé API SendGrid
  },
});
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
