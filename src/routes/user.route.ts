import { Router } from "express";
import {
  deleteUser,
  deleteUserById,
  getAllUsers,
  getCurrentUser,
} from "../controller/user.controller";
import { verifyAdmin, verifyToken } from "../middlewares/auth";
const router = Router();
router.get("/", verifyToken, verifyAdmin, getAllUsers);
router.delete("/", verifyToken, deleteUser);
router.delete('/:id',verifyToken,verifyAdmin,deleteUserById);
router.get("/me", verifyToken, getCurrentUser);

export default router;
