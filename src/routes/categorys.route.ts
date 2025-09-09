import {
  createCategory,
  deleteCategory,
  getAllCategorys,
  getCategoryById,
  updateCategory,
} from "../controller/categorys.controller";
import { Router } from "express";
import { requireAuth } from "../middlewares/verifyToken";
import {
  uploadHandler,
  uploadMemoryStorage,
} from "../middlewares/uploadMiddleware";
import { validate } from "../middlewares/validate";
import {
  CreateCatgegorySchema,
  ValidationIdCategory,
} from "../schema/validation.shema";
const router = Router();

// --- PUBLIC CATEGORY ROUTES
router.get("/", getAllCategorys);
router.get("/:id", getCategoryById);
// --- AdMIN CATEGORY CRUD OPERATIONS
router.post(
  "/",
  requireAuth,
  uploadMemoryStorage.single("image"),
  uploadHandler,
  validate(CreateCatgegorySchema),
  createCategory
);

router.put(
  "/:id",
  requireAuth,
  uploadMemoryStorage.single("image"),
  validate(CreateCatgegorySchema.partial()),
  validate(ValidationIdCategory, "params"),
  updateCategory
);

router.delete(
  "/:id",
  requireAuth,
  validate(ValidationIdCategory, "params"),
  deleteCategory
);

export default router;
