import { googleCallback } from "../../controller/auth/authGoogle.controller";
import { Router } from "express";
import passport from "passport";
const router = Router();
router.use(passport.initialize());
// Route pour démarrer l'authentification Google

router.get(
  "/",
  passport.authenticate("google", { scope: ["profile", "email"] })
);
router.get(
  "/callback",
  passport.authenticate("google", { session: false }),
  googleCallback
);

// Route de callback modifiée

export default router;
