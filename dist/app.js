"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const auth_route_1 = __importDefault(require("./routes/auth/auth.route"));
const mailer_1 = require("./utils/mailer");
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const dotenv_1 = require("dotenv");
const express_1 = __importDefault(require("express"));
const app = (0, express_1.default)();
(0, dotenv_1.config)();
const PORT = process.env.PORT;
app.use(express_1.default.static("view"));
app.use(express_1.default.json());
app.use((0, cookie_parser_1.default)());
mailer_1.transporter
    .verify()
    .then(() => console.log("✅ Server nodemailer ready to take our messages"))
    .catch((err) => console.error("❌ Server not ready:", err));
app.use("/", auth_route_1.default);
app.get("/", (req, res) => {
    console.log("5raaaaaaa");
    res.json({ message: "Server is running" });
});
app.listen(PORT, () => {
    console.log(`http://localhost:${PORT}`);
});
//# sourceMappingURL=app.js.map