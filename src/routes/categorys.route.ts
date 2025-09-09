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
  CreateCatgegorySchema,
  PaginationSchema,
  ValidationId,
} from "../schema/validation.shema";
const router = Router();

// --- PUBLIC CATEGORY ROUTES
router.get("/", validate(PaginationSchema, "query"), getAllCategorys);
router.get("/:id", validate(ValidationId, "params"), getCategoryById);

// --- AdMIN CATEGORY CRUD OPERATIONS
router.post(
  "/",
  verifyToken,
  verifyAdmin,
  uploadMemoryStorage.single("image"),
  uploadHandler,
  validate(CreateCatgegorySchema),
  createCategory
);

router.put(
  "/:id",
  verifyToken,
  verifyAdmin,
  uploadMemoryStorage.single("image"),
  validate(CreateCatgegorySchema.partial()),
  validate(ValidationId, "params"),
  updateCategory
);

router.delete(
  "/:id",
  verifyToken,
  verifyAdmin,
  validate(ValidationId, "params"),
  deleteCategory
);

export default router;
