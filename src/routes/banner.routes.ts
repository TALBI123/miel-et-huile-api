import * as bannerController from "../controller/banner.controller";
import { verifyToken, verifyAdmin } from "../middlewares/auth";
import { ValidationId } from "../schema/validation.shema";
import {  bannerUpdateSchema, createBannerSchema } from "../schema/banner.schema";
import { validate } from "../middlewares/validate";
import {
  uploadBannerMiddleware,
  uploadMemoryStorage,
  validateBannerImages,
} from "../middlewares/uploadMiddleware";
import { Router } from "express";
const router = Router();

router.get("/", bannerController.getAllBanners);

router.post(
  "/",
  verifyToken,
  verifyAdmin,
  uploadBannerMiddleware,
  validateBannerImages,
  validate({ schema: createBannerSchema, skipSave: true }),
  bannerController.createBanner
);

router.patch(
  "/",
  verifyToken,
  verifyAdmin,
  uploadBannerMiddleware,
  validateBannerImages,
  validate({ schema: ValidationId, key: "params" }),
  validate({ schema: bannerUpdateSchema, skipSave: true }),
  bannerController.updateBanner
);

router.delete(
  "/",
  verifyToken,
  verifyAdmin,
  validate({ schema: ValidationId, key: "params" }),
  bannerController.deleteBanner
);
export default router;
