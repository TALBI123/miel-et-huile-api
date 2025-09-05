import loginRegister from "./routes/auth/auth.route";
import verifyEmail from "./routes/auth/verifiy-email";
import categoryRoute from "./routes/categorys.route";
import { transporter } from "./utils/mailer";
import cookieParser from "cookie-parser";
import { config } from "dotenv";
import express from "express";
const app = express();
config();
const PORT = process.env.PORT;
app.use(express.static("view"));
app.use(express.json());
app.use(cookieParser());
transporter
  .verify()
  .then(() => console.log("✅ Server nodemailer ready to take our messages"))
  .catch((err) => console.error("❌ Server not ready:", err));
app.use("/", loginRegister);
app.use("/", verifyEmail);
app.use("/categorys", categoryRoute);
app.get("/", (req, res) => {
  console.log("5raaaaaaa")
  res.json({ message: "Server is running" })
});
app.listen(PORT, () => {
  console.log(`http://localhost:${PORT}`);
});
