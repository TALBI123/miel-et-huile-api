import { Router } from "express";
import { requireAuth } from "../middlewares/verifyToken";
import {
  uploadHandler,
  uploadMemoryStorage,
} from "../middlewares/uploadMiddleware";
import { validate } from "../middlewares/validate";
import {
  createProduct,
  deleteProduct,
  getAllProducts,
  getProductById,
  updateProduct,
} from "controller/product.controller";
const router = Router();
// --- PUBLIC CATEGORY ROUTES

router.get("/", getAllProducts);
router.get("/:id", getProductById);

// --- Private CATEGORY Routes
router.post(
  "/",
  requireAuth,
  uploadMemoryStorage.single("image"),
  uploadHandler,
  createProduct
);

router.post(
  "/:id",
  requireAuth,
  uploadMemoryStorage.single("image"),
  updateProduct
);
router.delete("/:id", requireAuth, deleteProduct);

export default router;
