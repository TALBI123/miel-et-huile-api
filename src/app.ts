import express from "express";
import { config } from "dotenv";
import loginRegister from "../routes/auth/auth.route";
const app = express();
app.use(express.json());
config();
const PORT = 4000;
app.use("/", loginRegister);

app.listen(PORT, () => {
  console.log(`http://localhost:${PORT}`);
});
