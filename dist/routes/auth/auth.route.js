"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const auth_controller_1 = require("../../controller/auth/auth.controller");
const verifyToken_1 = require("../../middlewares/verifyToken");
const express_1 = require("express");
const router = (0, express_1.Router)();
router.post("/login", auth_controller_1.login);
router.post("/register", auth_controller_1.register);
router.get('/logout', verifyToken_1.requireAuth, auth_controller_1.logout);
exports.default = router;
//# sourceMappingURL=auth.route.js.map