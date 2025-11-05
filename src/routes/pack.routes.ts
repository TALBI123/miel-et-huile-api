import { checkEmptyRequestBody, validate } from "../middlewares/validate";
import { categorySlug, ValidationId } from "../schema/validation.shema";
import { verifyAdmin, verifyToken } from "../middlewares/auth";
import {
  uploadDiskMiddleware,
  uploadHandler,
} from "../middlewares/uploadMiddleware";

import {
  createProductShema,
  QueryProductSchema,
} from "../schema/product.shema";

import { Router } from "express";
import route from "./auth/verifiy-email.routes";
const router = Router();

// Routes publiques
router.get("/", validate({schema:QueryProductSchema}));
router.get("/:id", validate({ schema: ValidationId }));

// Routes protégées - Administrateur uniquement
router.post("/", verifyToken, verifyAdmin, checkEmptyRequestBody, validate({ schema: createProductShema }),);
router.patch('/:id', verifyToken, verifyAdmin, validate({ schema: createProductShema.partial() }));
router.delete("/:id", verifyToken, verifyAdmin, validate({ schema: ValidationId }));
export default router;