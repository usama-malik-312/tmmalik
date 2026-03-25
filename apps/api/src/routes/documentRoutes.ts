import { Router } from "express";
import * as controller from "../controllers/documentController.js";

const router = Router();

router.post("/generate", controller.generateDocument);
router.get("/", controller.getDocuments);
router.get("/:id", controller.getDocumentById);

export default router;
