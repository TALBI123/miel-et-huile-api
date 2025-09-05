import { createCategory, updateCategory } from "../controller/categorys.controller";
import { Router } from "express";
import { requireAuth } from "../middlewares/verifyToken";
import {
  uploadHandler,
  uploadMemoryStorage,
} from "../middlewares/uploadMiddleware";
import { validate } from "../middlewares/validate";
import { CreateCatgegorySchema } from "../schema/validation.shema";
const router = Router();
// router.get("/");

// --- AdMIN CATEGORY CRUD OPERATIONS
router.post(
  "/",
  requireAuth,
  validate(CreateCatgegorySchema.omit({ slug: true })),
  uploadMemoryStorage.single("image"),
  uploadHandler,
  createCategory
);

router.put(
  "/categorys/:id",
  requireAuth,
  validate(CreateCatgegorySchema.omit({ slug: true })),
  uploadMemoryStorage.single("image"),
  updateCategory
);
// router.delete("/categorys/:id", requireAuth,);

export default router;
