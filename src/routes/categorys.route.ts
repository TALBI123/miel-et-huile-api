import {
  createCategory,
  deleteCategory,
  getAllCategorys,
  getCategoryById,
  updateCategory,
} from "../controller/categorys.controller";
import { Router } from "express";
import { verifyAdmin, verifyToken } from "../middlewares/auth";
import {
  uploadHandler,
  uploadMemoryStorage,
} from "../middlewares/uploadMiddleware";
import { validate } from "../middlewares/validate";
import {
  CreateCategorySchema,
  PaginationSchema,
  ValidationId,
} from "../schema/validation.shema";
const router = Router();

// --- PUBLIC CATEGORY ROUTES
router.get(
  "/",
  validate({ schema: PaginationSchema, key: "query",skipSave:true }),
  getAllCategorys
);
router.get(
  "/:id",
  validate({ schema: ValidationId, key: "params" }),
  getCategoryById
);

// --- AdMIN CATEGORY CRUD OPERATIONS
router.post(
  "/",
  verifyToken,
  // verifyAdmin,
  uploadMemoryStorage.single("image"),
  uploadHandler,
  validate({ schema: CreateCategorySchema }),
  createCategory
);

router.put(
  "/:id",
  verifyToken,
  verifyAdmin,
  uploadMemoryStorage.single("image"),
  validate({ schema: CreateCategorySchema.partial() }),
  validate({ schema: ValidationId, key: "params" }),
  updateCategory
);

router.delete(
  "/:id",
  verifyToken,
  // verifyAdmin,
  validate({ schema: ValidationId, key: "params" }),
  deleteCategory
);

export default router;
