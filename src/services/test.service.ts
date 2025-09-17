import sgMail from "@sendgrid/mail";
import ejs from "ejs";
import path from "path";
import { MailOptions } from "../types/type";
interface SendGridError extends Error {
  code?: number;
  response?: {
    body: any;
    headers: Record<string, string>;
    statusCode: number;
  };
}
const isSendGridError = (err: any): err is SendGridError => {
  return err && typeof err === "object" && "response" in err;
};
// Configuration SendGrid
if (!process.env.SENDGRID_API_KEY) {
  console.warn("⚠️  SENDGRID_API_KEY is not defined");
} else {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}
export const sendEmail = async <T extends Record<string, any>>({
  to,
  subject,
  htmlFileName,
  context,
}: MailOptions<T>) => {
  try {
    console.log("📧 Attempting to send email to:", to);
    // Vérification des variables requises
    if (!process.env.SENDGRID_API_KEY)
      throw new Error(
        "SENDGRID_API_KEY is not defined in environment variables"
      );

    if (!process.env.EMAIL_USER)
      throw new Error("EMAIL_USER is not defined in environment variables");
    // Rendu du template EJS
    const templateFile = path.join(__dirname, `../../views/${htmlFileName}`);
    const htmlContent = await ejs.renderFile(templateFile, context);
    console.log("📄 Using template:", templateFile);
    // Configuration du message SendGrid
    const msg = {
      to: Array.isArray(to) ? to : [to],
      from: process.env.EMAIL_USER,
      subject,
      html: htmlContent,
    };

    console.log("🔄 Sending email via SendGrid...");
    const response = await sgMail.send(msg);
    console.log("✅ Email sent successfully. Status:", response[0].statusCode);
  } catch (err: any) {
    console.error("❌ SendGrid error details:");
    console.error("Error name:", err.name);
    if (isSendGridError(err)) {
      console.error("Error code:", err.code);
      if (err.response) {
        console.error("Status code:", err.response.statusCode);
        console.error("Error response body:", err.response.body);
      }
    }

    throw new Error(`Email sending failed: ${err.message}`);
  }
};
export const verifySendGridConnection = async (): Promise<boolean> => {
  try {
    console.log(
      "🔍 Testing SendGrid connection (like transporter.verify())..."
    );
    if (!process.env.EMAIL_TEST) {
      console.log("⚠️  EMAIL_TEST is not defined");
      throw new Error("EMAIL_TEST  is not defined");
    }
    const testMsg = {
      to: process.env.EMAIL_TEST!, // Email factice pour le test
      from: process.env.EMAIL_USER!,
      subject: "Connection Test",
      text: "This is a connection test email",
      html: "<p>This is a connection test email</p>",
    };
    // Cette instruction va tester l'authentification et la connexion

    await sgMail.send(testMsg);
    console.log("✅ SendGrid connection verified successfully!");

    return true;
  } catch (err: any) {
    console.error("❌ SendGrid connection verification failed:", err.message);

    if (isSendGridError(err)) {
      console.error("Error code:", err.code);
      if (err.response) {
        console.error("Status code:", err.response.statusCode);
        console.error(
          "Error response:",
          JSON.stringify(err.response.body, null, 2)
        );
      }
    } else {
      console.error("❌ Unknown error during connection verification:", err);
    }

    return false;
  }
};

export const testEmailConnection = async (
  testEmail: string = "morocostudent@gmail.com"
): Promise<void> => {
  try {
    if (!verifyEmailConfig()) {
      console.log("❌ configuration email incorrecte");
      throw new Error("Email service not configured");
    }
    console.log("🧪 Testing SendGrid connection...");

    const testMsg = {
      to: testEmail,
      from: process.env.EMAIL_USER!,
      subject: "Test Connection - SendGrid",
      html: `
        <h1>Test de connexion SendGrid</h1>
        <p>Cet email confirme que votre configuration SendGrid fonctionne correctement.</p>
        <p>Timestamp: ${new Date().toISOString()}</p>
      `,
    };
    const response = await sgMail.send(testMsg);
    console.log("✅ SendGrid test successful. Status:", response[0].statusCode);
  } catch (error: any) {
    console.error("❌ SendGrid test failed:", error.message);

    if (isSendGridError(error) && error.response) {
      console.error("Error details:", error.response.body);
    }

    throw error;
  }
};
// Fonction de vérification de base
export const verifyEmailConfig = (): boolean => {
  const hasApiKey = !!process.env.SENDGRID_API_KEY;
  const hasEmailUser = !!process.env.EMAIL_USER;
  return hasApiKey && hasEmailUser;
};
