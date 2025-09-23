import {  login, logout, register } from "../../controller/auth/auth.controller";
import { authSchema } from "../../schema/auth.schema";
import { validate } from "../../middlewares/validate";
import { Router } from "express";
const router = Router();

router.post("/login", validate({ schema: authSchema.pick({ email: true, password: true }) }), login);
router.post("/register", validate({ schema: authSchema }), register);
router.get("/logout", logout);

export default router;
