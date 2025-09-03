import { Router } from "express";
import {verifyEmail} from "../../controllers/auth/verify-email";
const route = Router();
route.post("/verification-email",verifyEmail);
export default route;
