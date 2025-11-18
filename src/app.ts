import { PacklinkServiceTest } from "./services/packlink.service";
import forgetPassword from "./routes/auth/forgetPassword.routes";
import adminReviewsRoute from "./routes/admin-reviews.routes";
import verifyEmail from "./routes/auth/verifiy-email.routes";

import { errorHandler } from "./middlewares/handleErrors";
import googleAuth from "./routes/auth/authGoogle.routes";
import loginRegister from "./routes/auth/auth.routes";
import categoryRoute from "./routes/categorys.routes";
import shippingRoutes from "./routes/shipping.routes";
import webhookRoutes from "./routes/webhook.routes";
import productRoute from "./routes/product.routes";
import bannerRoutes from "./routes/banner.routes";
import checkout from "./routes/checkout.routes";
import { setupSwagger } from "./config/swagger";
import ordersRoute from "./routes/order.routes";
import usersRoute from "./routes/user.routes";
import cookieParser from "cookie-parser";
import express, { Request, Response } from "express";
import cors from "cors";

const app = express();

// app.use(cors({ origin: "http://domain:5173", credentials: true }));
app.use(cors({ origin: true, credentials: true }));

// ⚠️ IMPORTANT: Les webhooks doivent être AVANT express.json()
app.use("/api/webhooks", webhookRoutes);

// middleware pckages
app.use(express.static("view"));
app.use(express.json());
app.use(cookieParser());

// Connect to Redis
// connectRedis().catch((err) => {
//   console.error("❌ Unable to connect to Redis:", err);
// });

// Routes
// ---- AUth
app.use("/api/auth/verify-email", verifyEmail);
app.use("/api/auth/google", googleAuth);
app.use("/api/auth", loginRegister);
app.use("/api/auth", forgetPassword);

// ---- API
app.use("/api/admin/reviews", adminReviewsRoute);
app.use("/api/categorys", categoryRoute);
app.use("/api/products", productRoute);
app.use("/api/banners", bannerRoutes);
app.use("/api/orders", ordersRoute);
app.use("/api", usersRoute);

// --- Checkout & Payment
app.use("/api/checkout", checkout);

// --- Shipping
app.use("/api/shipping", shippingRoutes);

// ---- Error Handler
app.use(errorHandler);
// Swagger Documentation
setupSwagger(app);

// Route de débogage pour vérifier les variables d'environnement Google OAuth
// Test .env Production
app.get("/auth/google/debug", (req: Request, res: Response) => {
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
if (process.env.NODE_ENV === "production") {
  console.log("🔍 Vérification des variables d'environnement Google OAuth:");
  console.log(
    " - GOOGLE_CLIENT_SECRET:",
    process.env.GOOGLE_CLIENT_SECRET ? "✅ Défini" : "❌ Manquant"
  );
  console.log(
    " - STRIPE_SECRET_KEY:",
    process.env.STRIPE_SECRET_KEY ? "✅ Défini" : "❌ Manquant"
  );
  console.log(
    " - STRIPE_PUBLIC_KEY:",
    process.env.STRIPE_PUBLIC_KEY ? "✅ Défini" : "❌ Manquant"
  );
  console.log(process.env.PORT || "❌ PORT non défini");
}

// Test Backup Service

// Test Packlink Service

// async function runPacklink() {
//   try {
//     console.log("🧪 Test Packlink...");
//     const result = await PacklinkServiceTest.testPacklink();
//     console.log("✅ Résultat:", result);
//   } catch (error) {
//     console.error("❌ Erreur:", error);
//   }
// }

// runPacklink()

//  Test SendCloud Service

// (async () => {
//   const sendcloud = SendCloudService.getInstance();
//   try {
//     // 🔹 Étape 1 : Récupérer les transporteurs
//     const methods = await sendcloud.getShippingMethods();
//     // console.log("Méthodes disponibles:", methods);

//     // // 🔹 Étape 2 : Simuler les tarifs disponibles
//     // const rates = await sendcloud.getShippingMethods({
//     //   from_country: "FR",
//     //   to_country: "NL",
//     //   weight: 1.2,
//     // });
//     // console.table(rates);

//     // 🔹 Étape 3 : Créer un colis (exemple de commande)
//     console.log("Creating parcel...", methods);
//     const rates = await sendcloud.getShippingRates({
//       cart: {
//         items: [
//           {
//             id: "PROD_001",
//             quantity: 1,
//             weight: 1.2,
//             dimensions: { length: 30, width: 25, height: 15 },
//           },
//         ],
//         total_weight: 1.2,
//         total_value: 45.99,
//       },
//       destination: {
//         country: "FR",
//         postal_code: "69001",
//         city: "Lyon",
//       },
//     });
//     console.log("Shipping Rates:", rates);
//     // const parcel = await sendcloud.createParcel({
//     //   name: "Jean Dupont",
//     //   address: "12 rue de Paris",
//     //   city: "Lyon",
//     //   postal_code: "69000",
//     //   country: "FR",
//     //   weight: 1.3,
//     //   shipping_method_id: methods[0].id, // Ex: DHL Express
//     // });
//     // console.log("Colis créé:", parcel);
//   } catch (err) {
//     console.error("❌ Error initializing SendCloudService:", err);
//   }
// })();

export default app;
