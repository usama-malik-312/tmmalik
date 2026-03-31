import { Router } from "express";
import * as controller from "../controllers/documentController.js";

const router = Router();

router.get("/:id", controller.verifyDocument);

export default router;
