import sgMail from "@sendgrid/mail";
import ejs from "ejs";
import path from "path";
import { MailOptions } from "../types/type";

// Définition du type d'erreur SendGrid
interface SendGridError extends Error {
  code?: number;
  response?: {
    body: any;
    headers: Record<string, string>;
    statusCode: number;
  };
}

// Type guard pour vérifier le type d'erreur SendGrid
function isSendGridError(error: any): error is SendGridError {
  return error && typeof error === "object" && "response" in error;
}

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
}: MailOptions<T>): Promise<void> => {
  try {
    console.log("📧 Attempting to send email to:", to);

    // Vérification des variables requises
    if (!process.env.SENDGRID_API_KEY) {
      throw new Error(
        "SENDGRID_API_KEY is not defined in environment variables"
      );
    }

    if (!process.env.EMAIL_USER) {
      throw new Error("EMAIL_USER is not defined in environment variables");
    }

    // Rendu du template EJS
    const templateFile = path.join(__dirname, `../../views/${htmlFileName}`);
    console.log("📄 Using template:", templateFile);

    const htmlContent = await ejs.renderFile(templateFile, context || {});

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
  } catch (error: any) {
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

export const verifySendGridConnection = async (): Promise<boolean> => {
  try {
    console.log(
      "🔍 Testing SendGrid connection (like transporter.verify())..."
    );

    // Méthode 1: Envoyer un email test vide (équivalent à verify)
    const testMsg = {
      to: "test@example.com",
      from: process.env.EMAIL_USER!,
      subject: "Sandbox Test",
      text: "Ceci est un test sandbox",
      mailSettings: {
        sandboxMode: {
          enable: true, // ✅ n’enverra pas l’email
        },
      },
    };

    // Cette instruction va tester l'authentification et la connexion
    const response = await sgMail.send(testMsg);
    console.log("Sandbox response status:", response[0].statusCode);
    console.log("✅ SendGrid connection verified successfully!");
    return true;
  } catch (error: any) {
    console.error("❌ SendGrid connection verification failed:", error.message);

    if (isSendGridError(error)) {
      console.error("Error code:", error.code);
      if (error.response) {
        console.error("Status code:", error.response.statusCode);
        console.error(
          "Error response:",
          JSON.stringify(error.response.body, null, 2)
        );
      }
    } else {
      console.error("❌ Unknown error during connection verification:", error);
    }

    return false;
  }
};

// Fonction pour tester la connexion SendGrid
export const testEmailConnection = async (
  testEmail: string = "test@example.com"
): Promise<void> => {
  try {
    if (!verifyEmailConfig()) {
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
