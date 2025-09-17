import googleAuth from "./routes/auth/authGoogle.route";
import verifyEmail from "./routes/auth/verifiy-email";
import loginRegister from "./routes/auth/auth.route";
import categoryRoute from "./routes/categorys.route";
import productRoute from "./routes/product.route";
// import { transporter } from "./utils/mailer";
// import { connectRedis } from "./config/cache";
import cookieParser from "cookie-parser";
import { config } from "dotenv";
import express from "express";
import cors from "cors";
import "./config/passport";
const PORT = process.env.PORT || 4000;
const app = express();
app.use(cors({ origin: true, credentials: true }));
if (process.env.NODE_ENV !== "production") {
  config(); // seulement en dev
}

// middleware pckages
app.use(express.static("view"));
app.use(express.json());
app.use(cookieParser());

// Connect to nodeMailer
// transporter
//   .verify()
//   .then(() => console.log("✅ Server nodemailer ready to take our messages"))
//   .catch((err) => console.error("❌ Server not ready:", err));

// Connect to Redis
// connectRedis().catch((err) => {
//   console.error("❌ Unable to connect to Redis:", err);
// });

// Routes
app.use("/", googleAuth);
app.use("/", loginRegister);
app.use("/", verifyEmail);
app.use("/categorys", categoryRoute);
app.use("/products", productRoute);

app.get("/", async (req, res) => {

  res.json({
    message: "Server is running updated",
    sendGrind: process.env.SENDGRID_API_KEY,
    port: process.env.PORT,
    user: process.env.EMAIL_USER,
  });
});
app.listen(Number(PORT), () => {
  console.log(`http://localhost:${PORT}`);
});
