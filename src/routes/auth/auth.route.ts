import { authSchema } from "../../schema/auth.schema";
import { login, logout, register } from "../../controller/auth/auth.controller";
import { requireAuth } from "../../middlewares/verifyToken";
import { Router } from "express";
import { validate } from "../../middlewares/validate";
const router = Router();

router.post("/login", validate(authSchema.pick({ email: true, password: true })), login);
router.post("/register", validate(authSchema), register);
router.get("/logout", requireAuth, logout);
export default router;
