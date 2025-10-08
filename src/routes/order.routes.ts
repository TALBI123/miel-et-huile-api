import { queryOrderSchema, ValidationId } from "../schema/validation.shema";
import { verifyAdmin, verifyToken } from "../middlewares/auth";
import { validate } from "../middlewares/validate";
import {
  cancelOrder,
  getOrderById,
  getOrders,
} from "../controller/order.controller";
import { Router } from "express";
const router = Router();
router.get(
  "/",
  verifyToken,
  verifyAdmin,
  validate({ schema: queryOrderSchema, skipSave: true, key: "query" }),
  getOrders
); // toutes les commandes de l’utilisateur
router.get(
  "/:id",
  verifyToken,
  verifyAdmin,
  validate({ schema: ValidationId }),
  getOrderById
); // détail d’une commande
router.put(
  "/:id/cancel",
  verifyToken,
  verifyAdmin,
  validate({ schema: ValidationId }),
  cancelOrder
); // annuler une commande
export default router;
