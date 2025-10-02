
import { Router } from "express";
import { createCheckoutSession } from "../controller/checkout.controller";
const router = Router();
router.post("/", createCheckoutSession);

export default router;