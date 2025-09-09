import { Router } from "express";
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
} from "../controller/product.controller";
import { createProductShema, PaginationSchema, ValidationId } from "../schema/validation.shema";
import { verifyAdmin, verifyToken } from "../middlewares/auth";
const router = Router();
// --- PUBLIC CATEGORY ROUTES

router.get("/", validate(PaginationSchema, "query"), getAllProducts);
router.get("/:id", validate(ValidationId, "params"), getProductById);

// --- Private CATEGORY Routes
router.post(
  "/",
  verifyToken,
  // verifyAdmin,
  uploadMemoryStorage.single("image"),
  uploadHandler,
  validate(createProductShema),
  createProduct
);

router.post(
  "/:id",
  verifyToken,
  verifyAdmin,
  uploadMemoryStorage.single("image"),
  updateProduct
);
router.delete("/:id", verifyToken, verifyAdmin, deleteProduct);

export default router;
