import { Router } from "express";
import {verifyEmail} from "../../controller/auth/verifyEmail.controller";
const route = Router();
route.get("/verification-email",verifyEmail);
export default route;