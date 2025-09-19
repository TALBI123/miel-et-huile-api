import { Router } from "express";
import {verifyEmail} from "../../controller/auth/verifyEmail.controller";
const route = Router();
route.get("/verify-email",verifyEmail);
export default route;