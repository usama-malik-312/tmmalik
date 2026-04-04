import { Router } from "express";
import * as controller from "../controllers/authController.js";
import { requireAuth } from "../middleware/requireAuth.js";

const router = Router();

router.post("/register", controller.register);
router.post("/login", controller.login);
router.post("/logout", controller.logout);
router.get("/me", requireAuth, controller.meGet);
router.put("/me", requireAuth, controller.meUpdate);

export default router;

