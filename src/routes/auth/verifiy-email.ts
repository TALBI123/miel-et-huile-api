import { Router } from "express";
import {verifyEmail} from "../../controller/auth/verifyEmail.controller";
const route = Router();
route.get("/",verifyEmail);
export default route;