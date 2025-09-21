
import { authSchema } from "../../schema/auth.schema";
import { login, logout, register } from "../../controller/auth/auth.controller";
import { Router } from "express";
import { validate } from "../../middlewares/validate";
import { verifyToken } from "../../middlewares/auth";

const router = Router();


export default router;