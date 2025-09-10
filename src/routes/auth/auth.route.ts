import { authSchema } from "../../schema/auth.schema";
import { login, logout, register } from "../../controller/auth/auth.controller";
import { Router } from "express";
import { validate } from "../../middlewares/validate";
import { verifyToken } from "../../middlewares/auth";
const router = Router();

router.post("/login", validate({ schema: authSchema.pick({ email: true, password: true }) }), login);
router.post("/register", validate({ schema: authSchema }), register);
router.get("/logout", verifyToken, logout);
export default router;
