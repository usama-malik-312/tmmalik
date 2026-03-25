import { Router } from "express";
import * as controller from "../controllers/caseController.js";

const router = Router();

router.post("/", controller.createCase);
router.get("/", controller.getCases);
router.get("/:id", controller.getCaseById);
router.put("/:id", controller.updateCase);

export default router;
