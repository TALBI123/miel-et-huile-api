import { login, logout, register } from "../../controller/auth/auth.controller";
import {requireAuth} from "../../middlewares/verifyToken"
import { Router } from "express";
const router = Router();


router.post("/login", login);
router.post("/register", register);
router.get('/logout',requireAuth,logout);
export default router;
