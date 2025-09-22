import {
  forgetPassword,
  resetPassword,
} from "../../controller/auth/forgetPassword.controller";
import { validate } from "../../middlewares/validate";
import {
  forgetPasswordSchema,
  resetPasswordSchema,
} from "../../schema/auth.schema";
import { Router } from "express";

const router = Router();
router.post(
  "/forgot-password",
  validate({ schema: forgetPasswordSchema }),
  forgetPassword
);
router.post(
  "/reset-password",
  validate({ schema: resetPasswordSchema }),
  resetPassword
);

export default router;
