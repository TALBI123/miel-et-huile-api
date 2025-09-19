import { Router } from "express";
import {
  uploadHandler,
  uploadMemoryStorage,
} from "../middlewares/uploadMiddleware";
import { validate } from "../middlewares/validate";
import {
  createProduct,
  deleteProduct,
  getProducts,
  getProductById,
  updateProduct,
} from "../controller/product.controller";
import {
  createProductShema,
  QuerySchema,
  ValidationId,
} from "../schema/validation.shema";
import { verifyAdmin, verifyToken } from "../middlewares/auth";
const router = Router();
// --- PUBLIC CATEGORY ROUTES

router.get(
  "/",
  validate({ schema: QuerySchema, key: "query", skipSave: true }),
  getProducts
);

router.get(
  "/:id",
  validate({ schema: ValidationId, key: "params" }),
  getProductById
);

// --- Private Product Routes
router.post(
  "/",
  verifyToken,
  verifyAdmin,
  uploadMemoryStorage.single("image"),
  uploadHandler,
  validate({ schema: createProductShema, skipSave: true }),
  createProduct
);

router.put(
  "/:id",
  verifyToken,
  verifyAdmin,
  uploadMemoryStorage.single("image"),
  updateProduct
);

router.delete("/:id", verifyToken, verifyAdmin, deleteProduct);

export default router;
