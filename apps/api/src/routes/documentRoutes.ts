import { Router } from "express";
import * as controller from "../controllers/documentController.js";

const router = Router();

router.post("/generate", controller.generateDocument);
router.post("/:id/duplicate", controller.duplicateDocument);
router.get("/", controller.getDocuments);
router.get("/:id", controller.getDocumentById);
router.put("/:id", controller.updateDocument);
router.delete("/:id", controller.deleteDocument);

export default router;
