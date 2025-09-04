import { Router } from "express";
import { requireAuth } from "middlewares/verifyToken";
const router = Router();
router.get("/");

// --- AdMIN CATEGORY CRUD OPERATIONS
router.post("/categorys", requireAuth,);
router.put("/categorys/:id", requireAuth,);
router.delete("/categorys/:id", requireAuth,);

export default router;
