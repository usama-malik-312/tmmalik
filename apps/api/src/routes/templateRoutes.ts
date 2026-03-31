import { Router } from "express";
import * as controller from "../controllers/templateController.js";

const router = Router();

router.post("/", controller.createTemplate);
router.post("/:id/duplicate", controller.duplicateTemplate);
router.get("/", controller.getTemplates);
router.get("/:id", controller.getTemplateById);
router.put("/:id", controller.updateTemplate);
router.delete("/:id", controller.deleteTemplate);

export default router;
