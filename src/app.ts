import loginRegister from "../routes/auth/auth.route";
import {transporter} from "../utils/mailer"
import { config } from "dotenv";
import express from "express";
const app = express();
const PORT = process.env.PORT;
app.use(express.static("view"));
app.use(express.json());
transporter
  .verify()
  .then(() => console.log("✅ Server ready to take our messages"))
  .catch((err) => console.error("❌ Server not ready:", err));
config();
app.use("/", loginRegister);

app.listen(PORT, () => {
  console.log(`http://localhost:${PORT}`);
});
