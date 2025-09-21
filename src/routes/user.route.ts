import { Router } from "express";
import { deleteUser, getAllUsers } from "../controller/user.controller";
import { verifyAdmin, verifyToken } from "../middlewares/auth";
const router = Router();
router.get("/", verifyToken, verifyAdmin, getAllUsers);
router.delete("/users", verifyToken, deleteUser);
export default router;
