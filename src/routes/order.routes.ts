import { verifyAdmin, verifyToken } from "../middlewares/auth";
import {
  cancelOrder,
  getOrderById,
  getOrders,
} from "../controller/order.controller";
import { Router } from "express";
const router = Router();
router.get("/", verifyToken, verifyAdmin, getOrders); // toutes les commandes de l’utilisateur
router.get("/:id", verifyToken, verifyAdmin, getOrderById); // détail d’une commande
router.put("/:id/cancel", verifyToken, verifyAdmin, cancelOrder); // annuler une commande
export default router;
